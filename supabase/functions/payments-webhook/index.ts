/**
 * POST /functions/v1/payments-webhook
 * Notificações do Mercado Pago. Segurança: assinatura HMAC (x-signature) +
 * nova consulta do pagamento na API (nunca confiamos no corpo do webhook).
 * Idempotente: reenvios do provedor não duplicam efeitos.
 */
import { getEnv } from '../_shared/env.ts';
import { fail, json, log } from '../_shared/http.ts';
import { verifyMercadoPagoSignature } from '../_shared/payments/mercadopago.ts';
import { paymentProvider } from '../_shared/payments/index.ts';
import { serviceClient } from '../_shared/supabase.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method !== 'POST') return fail(req, 'METHOD_NOT_ALLOWED', 405);
  const env = getEnv();
  const url = new URL(req.url);
  const body = (await req.json().catch(() => ({}))) as { type?: string; action?: string; data?: { id?: string | number } };

  const type = url.searchParams.get('type') ?? url.searchParams.get('topic') ?? body.type;
  const dataId = url.searchParams.get('data.id') ?? url.searchParams.get('id') ?? (body.data?.id != null ? String(body.data.id) : null);

  if (type !== 'payment' || !dataId) {
    return json(req, { ignored: true });
  }

  const valid = await verifyMercadoPagoSignature({
    secret: env.mercadoPagoWebhookSecret,
    signatureHeader: req.headers.get('x-signature'),
    requestId: req.headers.get('x-request-id'),
    dataId,
  });
  if (!valid) {
    log('warn', 'webhook.invalid_signature', { dataId });
    return fail(req, 'UNAUTHORIZED', 401);
  }

  const db = serviceClient();
  try {
    const payment = await paymentProvider('mercadopago').getPayment(dataId);
    const ref = payment.externalReference;
    if (!ref || !UUID.test(ref)) {
      log('warn', 'webhook.unknown_reference', { dataId });
      return json(req, { ignored: true });
    }

    const { data: row } = await db.from('payments').select('id, amount_cents, provider_payment_id').eq('id', ref).maybeSingle();
    if (!row) return json(req, { ignored: true });

    if (!row.provider_payment_id) {
      await db.from('payments').update({ provider_payment_id: payment.providerPaymentId }).eq('id', row.id);
    }

    if (payment.status === 'approved') {
      if (payment.amountCents < row.amount_cents) {
        log('error', 'webhook.amount_mismatch', { paymentId: row.id });
        return json(req, { ignored: true });
      }
      const { data: result, error } = await db.rpc('confirm_payment', {
        p_payment_id: row.id,
        p_provider_payment_id: payment.providerPaymentId,
        p_raw: payment.raw as never,
      });
      if (error) throw error;
      log('info', 'webhook.payment_approved', { paymentId: row.id, result });
      return json(req, { ok: true, result });
    }

    if (payment.status === 'rejected' || payment.status === 'cancelled') {
      await db.rpc('fail_payment', { p_payment_id: row.id, p_status: payment.status, p_raw: payment.raw as never });
    }
    return json(req, { ok: true, status: payment.status });
  } catch (e) {
    log('error', 'webhook.error', { message: String(e) });
    // 500 → o provedor tenta novamente mais tarde
    return fail(req, 'INTERNAL_ERROR', 500);
  }
});
