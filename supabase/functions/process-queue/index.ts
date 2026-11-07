/**
 * POST /functions/v1/process-queue   (chamado pelo pg_cron a cada minuto)
 * Envia notificações vencidas (e-mail/WhatsApp) e processa estornos pendentes.
 * Autenticação: cabeçalho x-worker-secret == WORKER_SECRET.
 */
import { getEnv } from '../_shared/env.ts';
import { safeEqual } from '../_shared/crypto.ts';
import { fail, json, log } from '../_shared/http.ts';
import { sendEmail, sendWhatsApp } from '../_shared/notify/channels.ts';
import {
  renderEmail,
  renderWhatsApp,
  shouldSkip,
  type NotificationContext,
} from '../_shared/notify/templates.ts';
import { paymentProvider } from '../_shared/payments/index.ts';
import { serviceClient } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  const env = getEnv();
  const secret = req.headers.get('x-worker-secret') ?? '';
  if (!env.workerSecret || !safeEqual(secret, env.workerSecret))
    return fail(req, 'UNAUTHORIZED', 401);

  const db = serviceClient();
  const summary = { sent: 0, failed: 0, skipped: 0, refunds: 0, refundErrors: 0, expired: 0 };

  const expired = await db.rpc('expire_pending_bookings');
  summary.expired = (expired.data as number) ?? 0;

  // ---- Notificações -------------------------------------------------------
  const { data: claimed, error: claimError } = await db.rpc('claim_notifications', { p_limit: 25 });
  if (claimError) {
    log('error', 'queue.claim_failed', { message: claimError.message });
    return fail(req, 'INTERNAL_ERROR', 500);
  }

  for (const n of claimed ?? []) {
    try {
      const { data: ctxData, error } = await db.rpc('notification_context', {
        p_notification_id: n.id,
      });
      if (error || !ctxData) throw new Error(error?.message ?? 'contexto ausente');
      const ctx = ctxData as unknown as NotificationContext;

      const skip = shouldSkip(ctx);
      if (skip) {
        await db.rpc('complete_notification', { p_id: n.id, p_status: 'skipped', p_error: skip });
        summary.skipped++;
        continue;
      }

      const opts = { appUrl: env.appUrl, appName: env.appName };
      let providerMessageId: string | null = null;
      if (n.channel === 'email') {
        ({ providerMessageId } = await sendEmail(env, n.recipient, renderEmail(ctx, opts)));
      } else {
        const msg = renderWhatsApp(ctx, opts);
        if (!msg) {
          await db.rpc('complete_notification', {
            p_id: n.id,
            p_status: 'skipped',
            p_error: 'no_template',
          });
          summary.skipped++;
          continue;
        }
        ({ providerMessageId } = await sendWhatsApp(env, n.recipient, msg));
      }
      await db.rpc('complete_notification', {
        p_id: n.id,
        p_status: 'sent',
        p_provider_message_id: providerMessageId as string,
      });
      summary.sent++;
    } catch (e) {
      log('warn', 'queue.send_failed', {
        notificationId: n.id,
        channel: n.channel,
        message: String(e).slice(0, 300),
      });
      await db.rpc('complete_notification', { p_id: n.id, p_status: 'failed', p_error: String(e) });
      summary.failed++;
    }
  }

  // ---- Estornos -----------------------------------------------------------
  const { data: refunds } = await db.rpc('claim_refunds', { p_limit: 10 });
  for (const p of refunds ?? []) {
    try {
      if (!p.provider_payment_id) throw new Error('pagamento sem id no provedor');
      await paymentProvider(p.provider as 'fake' | 'mercadopago').refund(
        p.provider_payment_id,
        p.amount_cents,
        p.id,
      );
      await db.rpc('complete_refund', { p_payment_id: p.id, p_ok: true });
      summary.refunds++;
    } catch (e) {
      await db.rpc('complete_refund', { p_payment_id: p.id, p_ok: false, p_error: String(e) });
      summary.refundErrors++;
    }
  }

  log('info', 'queue.done', summary);
  return json(req, summary);
});
