/**
 * POST /functions/v1/public-booking
 * Criação de reserva pela página pública.
 * Ordem: rate limit (IP) → validação Zod → rate limit (e-mail) → captcha →
 * create_booking (transação + exclusion constraint + idempotência) → sinal.
 */
import {
  errorCodeFrom,
  publicBookingRequestSchema,
  CONSENT_VERSION,
  type PublicBooking,
} from '../../../packages/shared/src/index.ts';
import { getEnv } from '../_shared/env.ts';
import { allow, verifyCaptcha } from '../_shared/guards.ts';
import { ensureDepositPayment } from '../_shared/deposit.ts';
import { clientIp, fail, json, log, preflight } from '../_shared/http.ts';
import { serviceClient } from '../_shared/supabase.ts';

const STATUS_BY_CODE: Record<string, number> = {
  SLOT_UNAVAILABLE: 409,
  SERVICE_NOT_FOUND: 404,
  UNIT_NOT_FOUND: 404,
  INVALID_RANGE: 400,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight(req);
  if (req.method !== 'POST') return fail(req, 'METHOD_NOT_ALLOWED', 405);

  const db = serviceClient();
  const ip = clientIp(req);
  const limits = getEnv();

  if (
    !(await allow(db, `booking:ip:min:${ip}`, limits.bookingLimitIpPerMinute, 60)) ||
    !(await allow(db, `booking:ip:hour:${ip}`, limits.bookingLimitIpPerHour, 3600))
  ) {
    return fail(req, 'RATE_LIMITED', 429);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail(req, 'VALIDATION_ERROR', 400);
  }

  const parsed = publicBookingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return fail(req, 'VALIDATION_ERROR', 422, parsed.error.flatten());
  }
  const input = parsed.data;

  if (
    !(await allow(db, `booking:email:${input.client.email}`, limits.bookingLimitEmailPerHour, 3600))
  ) {
    return fail(req, 'RATE_LIMITED', 429);
  }
  if (!(await verifyCaptcha(input.captchaToken, ip))) {
    return fail(req, 'CAPTCHA_FAILED', 400);
  }

  const { data, error } = await db.rpc('create_booking', {
    p_service_id: input.serviceId,
    p_unit_id: input.unitId,
    p_professional_id: input.professionalId as string,
    p_starts_at: input.startsAt,
    p_client_name: input.client.name,
    p_client_email: input.client.email,
    p_client_phone: input.client.phone,
    p_notes: input.client.notes ?? '',
    p_idempotency_key: input.idempotencyKey,
    p_consent_version: CONSENT_VERSION,
  });

  if (error) {
    const code = errorCodeFrom(error);
    const status = STATUS_BY_CODE[code] ?? 500;
    if (status === 500) log('error', 'booking.create_failed', { message: error.message });
    return fail(req, code, status);
  }

  let booking = data as unknown as PublicBooking;

  if (booking.status === 'pending_payment') {
    try {
      await ensureDepositPayment(db, booking, input.paymentMethod ?? 'pix');
      const refreshed = await db.rpc('booking_public_payload', { p_booking_id: booking.id });
      booking = { ...(refreshed.data as unknown as PublicBooking), replayed: booking.replayed };
    } catch {
      return fail(req, 'PAYMENT_PROVIDER_ERROR', 502, {
        bookingId: booking.id,
        manageToken: booking.manage_token,
      });
    }
  }

  log('info', 'booking.created', {
    bookingId: booking.id,
    status: booking.status,
    replayed: booking.replayed,
  });
  return json(req, booking, booking.replayed ? 200 : 201);
});
