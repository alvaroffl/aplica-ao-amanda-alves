import { describe, expect, it } from 'vitest';
import { checkoutPaymentMethods, pixExpiration } from '../_shared/payments/mercadopago.ts';
import type { ProviderPayment } from '../_shared/payments/types.ts';
import { decideWebhook, paymentRowId } from '../payments-webhook/decide.ts';

const base: ProviderPayment = {
  providerPaymentId: '987',
  externalReference: '11111111-2222-4333-8444-555555555555',
  status: 'approved',
  amountCents: 23700,
  raw: { id: 987, status: 'approved' },
};

describe('webhook: decisão a partir do pagamento consultado na API', () => {
  it('aprovado com o valor do sinal confirma', () => {
    expect(decideWebhook(base, 23700)).toEqual({ action: 'confirm' });
  });
  it('aprovado com valor maior (ex.: juros do parcelamento) também confirma', () => {
    expect(decideWebhook({ ...base, amountCents: 25000 }, 23700)).toEqual({ action: 'confirm' });
  });
  it('aprovado com valor menor que o sinal é recusado', () => {
    expect(decideWebhook({ ...base, amountCents: 100 }, 23700)).toEqual({
      action: 'reject_amount',
    });
  });
  it('recusado ou cancelado marca a falha', () => {
    expect(decideWebhook({ ...base, status: 'rejected' }, 23700)).toEqual({
      action: 'fail',
      status: 'rejected',
    });
    expect(decideWebhook({ ...base, status: 'cancelled' }, 23700)).toEqual({
      action: 'fail',
      status: 'cancelled',
    });
  });
  it('pendente ou estornado não altera nada', () => {
    expect(decideWebhook({ ...base, status: 'pending' }, 23700).action).toBe('ignore');
    expect(decideWebhook({ ...base, status: 'refunded' }, 23700).action).toBe('ignore');
  });
  it('referência externa precisa ser um id nosso', () => {
    expect(paymentRowId(base)).toBe(base.externalReference);
    expect(paymentRowId({ externalReference: 'pedido-123' })).toBeNull();
    expect(paymentRowId({ externalReference: null })).toBeNull();
  });
});

describe('checkout do cartão', () => {
  it('limita as parcelas entre 1 e 12 e mantém à vista como padrão', () => {
    expect(checkoutPaymentMethods(3)).toMatchObject({ installments: 3, default_installments: 1 });
    expect(checkoutPaymentMethods(0).installments).toBe(1);
    expect(checkoutPaymentMethods(40).installments).toBe(12);
  });
  it('não oferece boleto nem lotérica (compensação lenta demais para a pré-reserva)', () => {
    expect(checkoutPaymentMethods(1).excluded_payment_types).toEqual([
      { id: 'ticket' },
      { id: 'atm' },
    ]);
  });
});

describe('prazo do Pix', () => {
  const now = new Date('2030-01-01T12:00:00Z');
  it('usa no mínimo 30 minutos no gateway', () => {
    const hold = new Date('2030-01-01T12:15:00Z');
    expect(pixExpiration(hold, now).toISOString()).toBe('2030-01-01T12:30:00.000Z');
  });
  it('mantém prazos maiores', () => {
    const hold = new Date('2030-01-01T13:00:00Z');
    expect(pixExpiration(hold, now)).toEqual(hold);
  });
});
