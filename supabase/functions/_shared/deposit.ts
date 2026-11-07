import type { PublicBooking } from '../../../packages/shared/src/index.ts';
import { getEnv } from './env.ts';
import { log } from './http.ts';
import { isTestMode, paymentProvider } from './payments/index.ts';
import type { ServiceClient } from './supabase.ts';

/**
 * Cria a cobrança do sinal para uma pré-reserva (status pending_payment).
 * Idempotente: se já existe pagamento pendente, não cria outro.
 */
export async function ensureDepositPayment(
  db: ServiceClient,
  booking: PublicBooking,
  method: 'pix' | 'card',
): Promise<void> {
  if (booking.status !== 'pending_payment' || booking.deposit_cents <= 0) return;
  if (booking.payment && ['pending', 'approved'].includes(booking.payment.status)) return;

  const env = getEnv();
  const provider = paymentProvider();

  // meios aceitos e parcelas vêm da configuração da clínica (nunca do front-end)
  const { data: settings, error: settingsError } = await db
    .from('businesses')
    .select('payment_methods, max_installments')
    .eq('id', booking.business.id)
    .single();
  if (settingsError) throw new Error(`businesses.select: ${settingsError.message}`);
  const allowed = (settings.payment_methods ?? ['pix']) as ('pix' | 'card')[];
  const chosen = allowed.includes(method) ? method : allowed[0]!;

  const paymentId = crypto.randomUUID();
  const expiresAt = new Date(booking.hold_expires_at ?? Date.now() + 15 * 60_000);

  const { error: insertError } = await db.from('payments').insert({
    id: paymentId,
    business_id: booking.business.id,
    booking_id: booking.id,
    provider: provider.name,
    method: chosen,
    amount_cents: booking.deposit_cents,
    expires_at: expiresAt.toISOString(),
    test_mode: isTestMode(provider.name as 'fake' | 'mercadopago'),
  });
  if (insertError) throw new Error(`payments.insert: ${insertError.message}`);

  try {
    const result = await provider.createPayment({
      paymentId,
      bookingId: booking.id,
      amountCents: booking.deposit_cents,
      method: chosen,
      maxInstallments: settings.max_installments ?? 1,
      description: `Sinal: ${booking.service.name} — ${booking.business.name}`,
      payer: { name: booking.client.name, email: booking.client.email },
      expiresAt,
      notificationUrl: `${env.functionsPublicUrl}/payments-webhook`,
      returnUrl: `${env.appUrl}/r/${booking.manage_token}`,
    });
    await db
      .from('payments')
      .update({
        provider_payment_id: result.providerPaymentId,
        pix_qr_code: result.pixQrCode ?? null,
        pix_qr_code_base64: result.pixQrCodeBase64 ?? null,
        checkout_url: result.checkoutUrl ?? null,
        raw: result.raw as never,
      })
      .eq('id', paymentId);
  } catch (e) {
    log('error', 'payment.create_failed', { bookingId: booking.id, message: String(e) });
    await db
      .from('payments')
      .update({ status: 'cancelled', last_error: String(e).slice(0, 1000) })
      .eq('id', paymentId);
    throw e;
  }
}
