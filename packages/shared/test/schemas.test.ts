import { describe, expect, it } from 'vitest';
import {
  clientDetailsSchema,
  errorCodeFrom,
  publicBookingRequestSchema,
  serviceSchema,
  slugSchema,
  weeklyAvailabilitySchema,
} from '../src/index.ts';

const validRequest = {
  serviceId: '3f1c2b1e-7d3a-4c55-9a1b-2b2c3d4e5f60',
  unitId: '4f1c2b1e-7d3a-4c55-9a1b-2b2c3d4e5f60',
  professionalId: null,
  startsAt: '2026-11-16T12:00:00.000Z',
  client: { name: 'Maria', email: ' MARIA@Exemplo.com ', phone: '(11) 98765-4321', consent: true },
  idempotencyKey: '5f1c2b1e-7d3a-4c55-9a1b-2b2c3d4e5f60',
  captchaToken: 'token',
};

describe('reserva pública', () => {
  it('aceita e normaliza um pedido válido', () => {
    const parsed = publicBookingRequestSchema.parse(validRequest);
    expect(parsed.client.email).toBe('maria@exemplo.com');
    expect(parsed.client.phone).toBe('+5511987654321');
  });

  it('exige consentimento LGPD', () => {
    const r = clientDetailsSchema.safeParse({ ...validRequest.client, consent: false });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.message).toBe('validation.consent');
  });

  it('rejeita telefone inválido com chave de i18n', () => {
    const r = clientDetailsSchema.safeParse({ ...validRequest.client, phone: '123' });
    expect(r.error?.issues[0]?.message).toBe('validation.phone');
  });

  it('rejeita horário sem fuso', () => {
    const r = publicBookingRequestSchema.safeParse({
      ...validRequest,
      startsAt: '2026-11-16T12:00:00',
    });
    expect(r.success).toBe(false);
  });
});

describe('slug', () => {
  it('bloqueia rotas reservadas', () => {
    expect(slugSchema.safeParse('painel').success).toBe(false);
    expect(slugSchema.safeParse('studio-ana').success).toBe(true);
    expect(slugSchema.safeParse('Studio Ana').success).toBe(false);
  });
});

describe('serviço', () => {
  const base = {
    name: 'Corte',
    duration_min: '60',
    price: '90,00',
    buffer_before_min: 0,
    buffer_after_min: 10,
    min_notice_min: 60,
    max_advance_days: 60,
    deposit_type: 'percent' as const,
    deposit_value: '30',
  };
  it('converte preço e sinal', () => {
    const s = serviceSchema.parse(base);
    expect(s.price_cents).toBe(9000);
    expect(s.deposit_value).toBe(30);
    expect(s.duration_min).toBe(60);
  });
  it('valida porcentagem', () => {
    expect(serviceSchema.safeParse({ ...base, deposit_value: '150' }).success).toBe(false);
  });
  it('sinal fixo em centavos', () => {
    expect(
      serviceSchema.parse({ ...base, deposit_type: 'fixed', deposit_value: '50' }).deposit_value,
    ).toBe(5000);
  });
});

describe('disponibilidade semanal', () => {
  it('rejeita intervalos sobrepostos', () => {
    const days = Array.from({ length: 7 }, () => [] as { start: string; end: string }[]);
    days[1] = [
      { start: '09:00', end: '12:00' },
      { start: '11:00', end: '14:00' },
    ];
    const r = weeklyAvailabilitySchema.safeParse({ unitId: validRequest.unitId, days });
    expect(r.success).toBe(false);
  });
});

describe('erros', () => {
  it('extrai códigos do Postgres', () => {
    expect(errorCodeFrom({ message: 'SLOT_UNAVAILABLE' })).toBe('SLOT_UNAVAILABLE');
    expect(
      errorCodeFrom({
        code: '23505',
        message: 'duplicate key value violates unique constraint "businesses_slug_key"',
      }),
    ).toBe('SLUG_TAKEN');
    expect(errorCodeFrom({ code: '23P01', message: 'conflicting key value' })).toBe(
      'SLOT_UNAVAILABLE',
    );
    expect(errorCodeFrom(new Error('boom'))).toBe('INTERNAL_ERROR');
  });
});
