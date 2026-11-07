import { z } from 'zod';
import { normalizePhone } from './phone.ts';
import { parseMoneyToCents } from './money.ts';
import { RESERVED_SLUGS, SLUG_REGEX } from './slug.ts';

/**
 * Esquemas Zod compartilhados entre o front-end (React Hook Form) e as
 * Edge Functions (Deno). As mensagens são CHAVES de i18n (ex.: "validation.email"),
 * traduzidas na interface.
 */

/** Versão do texto de consentimento LGPD exibido na reserva. */
export const CONSENT_VERSION = '2026-11-v1';

export const uuidSchema = z.string().uuid('validation.invalid');

const phoneSchema = z
  .string()
  .trim()
  .min(1, 'validation.phoneRequired')
  .transform((value, ctx) => {
    const normalized = normalizePhone(value);
    if (!normalized) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'validation.phone' });
      return z.NEVER;
    }
    return normalized;
  });

const optionalPhoneSchema = z
  .string()
  .trim()
  .optional()
  .transform((value, ctx) => {
    if (!value) return null;
    const normalized = normalizePhone(value);
    if (!normalized) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'validation.phone' });
      return z.NEVER;
    }
    return normalized;
  });

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('validation.email')
  .max(254, 'validation.email');

const optionalEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .optional()
  .transform((v) => (v ? v : null))
  .pipe(z.string().email('validation.email').max(254).nullable());

export const nameSchema = z
  .string()
  .trim()
  .min(2, 'validation.nameMin')
  .max(120, 'validation.nameMax');

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(SLUG_REGEX, 'validation.slugFormat')
  .refine((s) => !RESERVED_SLUGS.has(s), 'validation.slugReserved');

export const timeOfDaySchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'validation.time');

const moneySchema = z.union([z.string(), z.number()]).transform((value, ctx) => {
  const cents = parseMoneyToCents(value);
  if (cents === null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'validation.money' });
    return z.NEVER;
  }
  return cents;
});

const intInRange = (min: number, max: number) =>
  z.coerce
    .number({ invalid_type_error: 'validation.number' })
    .int('validation.number')
    .min(min, 'validation.min')
    .max(max, 'validation.max');

// ---------------------------------------------------------------------------
// Reserva pública
// ---------------------------------------------------------------------------
export const clientDetailsSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  notes: z.string().trim().max(500, 'validation.notesMax').optional().default(''),
  consent: z.literal(true, { errorMap: () => ({ message: 'validation.consent' }) }),
});
export type ClientDetailsInput = z.input<typeof clientDetailsSchema>;
export type ClientDetails = z.output<typeof clientDetailsSchema>;

export const paymentMethodSchema = z.enum(['pix', 'card']);
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export const publicBookingRequestSchema = z.object({
  serviceId: uuidSchema,
  unitId: uuidSchema,
  professionalId: uuidSchema.nullable(),
  startsAt: z.string().datetime({ offset: true, message: 'validation.invalid' }),
  client: clientDetailsSchema,
  idempotencyKey: uuidSchema,
  captchaToken: z.string().max(4096).optional().default(''),
  paymentMethod: paymentMethodSchema.optional(),
});
export type PublicBookingRequest = z.input<typeof publicBookingRequestSchema>;

export const cancelReasonSchema = z.object({
  reason: z.string().trim().max(500, 'validation.notesMax').optional().default(''),
});

// ---------------------------------------------------------------------------
// Autenticação
// ---------------------------------------------------------------------------
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'validation.required'),
});

export const signUpSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  password: z.string().min(8, 'validation.passwordMin').max(72, 'validation.passwordMax'),
});

export const passwordResetRequestSchema = z.object({ email: emailSchema });
export const newPasswordSchema = z
  .object({
    password: z.string().min(8, 'validation.passwordMin').max(72, 'validation.passwordMax'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: 'validation.passwordMismatch',
    path: ['confirm'],
  });

// ---------------------------------------------------------------------------
// Painel
// ---------------------------------------------------------------------------
export const onboardingSchema = z.object({
  name: nameSchema,
  slug: slugSchema,
  timezone: z.string().min(1, 'validation.required'),
  ownerIsProfessional: z.boolean().default(true),
});

export const businessSettingsSchema = z.object({
  name: nameSchema,
  slug: slugSchema,
  description: z.string().trim().max(1000, 'validation.max').optional().default(''),
  phone: optionalPhoneSchema,
  email: optionalEmailSchema,
  timezone: z.string().min(1, 'validation.required'),
  slot_interval_min: intInRange(5, 240),
  cancellation_window_hours: intInRange(0, 720),
  booking_hold_min: intInRange(5, 120),
  reminder_24h: z.boolean(),
  reminder_2h: z.boolean(),
  whatsapp_enabled: z.boolean(),
});

export const unitSchema = z.object({
  name: z.string().trim().min(1, 'validation.required').max(120, 'validation.nameMax'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]([a-z0-9-]{0,46}[a-z0-9])?$/, 'validation.slugFormat'),
  address: z.string().trim().max(300, 'validation.max').optional().default(''),
  phone: optionalPhoneSchema,
  timezone: z.string().min(1, 'validation.required'),
  active: z.boolean().default(true),
});

export const professionalSchema = z.object({
  name: z.string().trim().min(1, 'validation.required').max(120, 'validation.nameMax'),
  bio: z.string().trim().max(500, 'validation.max').optional().default(''),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'validation.color'),
  active: z.boolean().default(true),
  unit_ids: z.array(uuidSchema).min(1, 'validation.unitRequired'),
  service_ids: z.array(uuidSchema).default([]),
});

export const serviceSchema = z
  .object({
    name: z.string().trim().min(1, 'validation.required').max(120, 'validation.nameMax'),
    description: z.string().trim().max(1000, 'validation.max').optional().default(''),
    category: z.string().trim().max(60, 'validation.max').optional().default(''),
    duration_min: intInRange(5, 720),
    price: moneySchema,
    buffer_before_min: intInRange(0, 240),
    buffer_after_min: intInRange(0, 240),
    min_notice_min: intInRange(0, 43200),
    max_advance_days: intInRange(1, 365),
    deposit_type: z.enum(['none', 'fixed', 'percent']),
    deposit_value: z.union([z.string(), z.number()]).optional().default('0'),
    active: z.boolean().default(true),
    professional_ids: z.array(uuidSchema).default([]),
  })
  .transform((v, ctx) => {
    let depositValue = 0;
    if (v.deposit_type === 'fixed') {
      const cents = parseMoneyToCents(v.deposit_value);
      if (!cents || cents <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'validation.money',
          path: ['deposit_value'],
        });
        return z.NEVER;
      }
      depositValue = cents;
    } else if (v.deposit_type === 'percent') {
      const pct = Number(String(v.deposit_value).replace(',', '.'));
      if (!Number.isInteger(pct) || pct < 1 || pct > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'validation.percent',
          path: ['deposit_value'],
        });
        return z.NEVER;
      }
      depositValue = pct;
    }
    const { price, deposit_value: _ignored, ...rest } = v;
    void _ignored;
    return { ...rest, price_cents: price, deposit_value: depositValue };
  });
export type ServiceFormInput = z.input<typeof serviceSchema>;
export type ServiceFormOutput = z.output<typeof serviceSchema>;

export const availabilityIntervalSchema = z
  .object({ start: timeOfDaySchema, end: timeOfDaySchema })
  .refine((v) => v.end > v.start, { message: 'validation.timeRange', path: ['end'] });

export const weeklyAvailabilitySchema = z.object({
  unitId: uuidSchema,
  days: z
    .array(z.array(availabilityIntervalSchema))
    .length(7)
    .superRefine((days, ctx) => {
      days.forEach((intervals, d) => {
        const sorted = [...intervals].sort((a, b) => a.start.localeCompare(b.start));
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i]!.start < sorted[i - 1]!.end) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'validation.overlap', path: [d] });
          }
        }
      });
    }),
});
export type WeeklyAvailability = z.infer<typeof weeklyAvailabilitySchema>;

export const timeOffSchema = z
  .object({
    professional_id: uuidSchema,
    kind: z.enum(['time_off', 'block']),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'validation.date'),
    start_time: timeOfDaySchema,
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'validation.date'),
    end_time: timeOfDaySchema,
    reason: z.string().trim().max(200, 'validation.max').optional().default(''),
  })
  .refine((v) => `${v.end_date}T${v.end_time}` > `${v.start_date}T${v.start_time}`, {
    message: 'validation.timeRange',
    path: ['end_time'],
  });

export const holidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'validation.date'),
  name: z.string().trim().min(1, 'validation.required').max(120, 'validation.max'),
  unit_id: uuidSchema.nullable().default(null),
});

export const clientSchema = z.object({
  name: nameSchema,
  email: optionalEmailSchema,
  phone: optionalPhoneSchema,
  notes: z.string().trim().max(2000, 'validation.max').optional().default(''),
});

export const inviteSchema = z.object({
  email: emailSchema,
  role: z.enum(['admin', 'professional', 'reception']),
  professional_id: uuidSchema.nullable().default(null),
});

export const panelBookingSchema = z
  .object({
    service_id: uuidSchema,
    unit_id: uuidSchema,
    professional_id: uuidSchema,
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'validation.date'),
    time: timeOfDaySchema,
    client_id: uuidSchema.nullable().default(null),
    client_name: z.string().trim().max(120).optional().default(''),
    client_email: optionalEmailSchema,
    client_phone: optionalPhoneSchema,
    internal_notes: z.string().trim().max(1000, 'validation.max').optional().default(''),
  })
  .refine((v) => v.client_id || v.client_name.length >= 2, {
    message: 'validation.clientRequired',
    path: ['client_name'],
  });
