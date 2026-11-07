/**
 * Códigos de erro de negócio (vindos do banco ou das Edge Functions)
 * → chaves de tradução. Mantém uma única fonte de verdade.
 */
export const ERROR_CODES = [
  'SLOT_UNAVAILABLE',
  'SERVICE_NOT_FOUND',
  'UNIT_NOT_FOUND',
  'BUSINESS_NOT_FOUND',
  'INVALID_TOKEN',
  'OUTSIDE_POLICY_WINDOW',
  'BOOKING_NOT_ACTIVE',
  'RATE_LIMITED',
  'CAPTCHA_FAILED',
  'VALIDATION_ERROR',
  'PAYMENT_PROVIDER_ERROR',
  'FORBIDDEN',
  'LAST_ADMIN',
  'SLUG_TAKEN',
  'CLIENT_REQUIRED',
  'INVALID_RANGE',
  'AVAILABILITY_OVERLAP',
  'CANCEL_NOT_ALLOWED',
  'PAYMENT_NOT_REFUNDABLE',
  'INVALID_REFUND_AMOUNT',
  'INTERNAL_ERROR',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

/** Extrai um código conhecido de uma mensagem de erro do Postgres/PostgREST. */
export function errorCodeFrom(error: unknown): ErrorCode {
  const e = error as { message?: string; code?: string; details?: string } | null;
  const text = `${e?.message ?? ''} ${e?.details ?? ''}`;
  for (const code of ERROR_CODES) {
    if (text.includes(code)) return code;
  }
  if (e?.code === '23505' && text.includes('businesses_slug_key')) return 'SLUG_TAKEN';
  if (e?.code === '23P01') return 'SLOT_UNAVAILABLE';
  if (e?.code === '42501') return 'FORBIDDEN';
  return 'INTERNAL_ERROR';
}
