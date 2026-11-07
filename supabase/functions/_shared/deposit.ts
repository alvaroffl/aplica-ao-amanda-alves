import type { PublicBooking } from '../../../packages/shared/src/index.ts';
import { getEnv } from './env.ts';
import { log } from './http.ts';
import { paymentProvider } from './payments/index.ts';
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
  const paymentId = crypto.randomUUID();
  const expiresAt = new Date(booking.hold_expires_at ?? Date.now() + 15 * 60_000);

  const { error: insertError } = await db.from('payments').insert({
    id: paymentId,
    business_id: booking.business.id,
    booking_id: booking.id,
    provider: provider.name,
    method,
    amount_cents: booking.deposit_cents,
    expires_at: expiresAt.toISOString(),
  });
  if (insertError) throw new Error(`payments.insert: ${insertError.message}`);

  try {
    const result = await provider.createPayment({
      paymentId,
      bookingId: booking.id,
      amountCents: booking.deposit_cents,
      method,
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
    await db.from('payments').update({ status: 'cancelled', last_error: String(e).slice(0, 1000) }).eq('id', paymentId);
    throw e;
  }
}
