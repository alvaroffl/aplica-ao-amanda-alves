import { describe, expect, it } from 'vitest';
import { computeDeposit } from '../src/money';
import { paymentMethodLabel, policyRefundCents } from '../src/payments';

describe('paymentMethodLabel', () => {
  it('descreve Pix, crédito parcelado, débito e carteira', () => {
    expect(paymentMethodLabel('pix')).toBe('Pix');
    expect(paymentMethodLabel('card', 'credit_card', 3)).toBe('Cartão de crédito em 3x');
    expect(paymentMethodLabel('card', 'credit_card', 1)).toBe('Cartão de crédito');
    expect(paymentMethodLabel('card', 'debit_card')).toBe('Cartão de débito');
    expect(paymentMethodLabel('card', 'account_money')).toBe('Saldo Mercado Pago');
    expect(paymentMethodLabel('card', null)).toBe('Cartão');
  });
});

describe('policyRefundCents', () => {
  it('aplica o percentual da política sobre o que ainda não foi estornado', () => {
    expect(policyRefundCents(23700, 0, 100)).toBe(23700);
    expect(policyRefundCents(23700, 0, 50)).toBe(11850);
    expect(policyRefundCents(23700, 0, 0)).toBe(0);
    expect(policyRefundCents(10000, 4000, 50)).toBe(3000);
  });
  it('nunca devolve valor negativo nem acima do pago', () => {
    expect(policyRefundCents(10000, 12000, 100)).toBe(0);
    expect(policyRefundCents(10000, 0, 150)).toBe(10000);
  });
});

describe('sinal dos serviços da clínica (valores de demonstração)', () => {
  it.each([
    ['Avaliação gratuita', 0, 'none', 0, 0],
    ['Micro Sobrancelha', 79000, 'percent', 30, 23700],
    ['Retoque', 19000, 'percent', 30, 5700],
    ['Micro Labial Revitalização', 89000, 'percent', 30, 26700],
    ['Micro Labial Neutralização', 99000, 'percent', 30, 29700],
    ['Hydra Gloss', 25000, 'percent', 50, 12500],
    ['Camuflagem', 45000, 'percent', 30, 13500],
    ['Remoção a Laser', 28000, 'percent', 50, 14000],
    ['Protocolo Rejuvenescimento', 35000, 'percent', 50, 17500],
    ['Protocolo Controle de Acne', 28000, 'percent', 50, 14000],
    ['Protocolo Hidratação Profunda', 22000, 'percent', 50, 11000],
  ] as const)('%s', (_name, price, type, value, expected) => {
    expect(computeDeposit(price, type, value)).toBe(expected);
  });

  it('sinal fixo nunca passa do preço', () => {
    expect(computeDeposit(5000, 'fixed', 8000)).toBe(5000);
  });
});
