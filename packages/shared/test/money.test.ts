import { describe, expect, it } from 'vitest';
import { computeDeposit, formatMoney, parseMoneyToCents } from '../src/money.ts';

describe('dinheiro', () => {
  it('formata BRL', () => {
    expect(formatMoney(9050).replace(/\s/g, ' ')).toBe('R$ 90,50');
  });
  it.each([
    ['90', 9000],
    ['90,5', 9050],
    ['1.234,56', 123456],
    ['R$ 45,00', 4500],
    [12.3, 1230],
  ])('parse %s → %s', (input, cents) => {
    expect(parseMoneyToCents(input)).toBe(cents);
  });
  it('rejeita inválidos', () => {
    expect(parseMoneyToCents('abc')).toBeNull();
    expect(parseMoneyToCents(-1)).toBeNull();
  });
  it('calcula sinal igual ao banco', () => {
    expect(computeDeposit(9000, 'percent', 30)).toBe(2700);
    expect(computeDeposit(9000, 'fixed', 5000)).toBe(5000);
    expect(computeDeposit(3000, 'fixed', 5000)).toBe(3000);
    expect(computeDeposit(9000, 'none', 0)).toBe(0);
  });
});
