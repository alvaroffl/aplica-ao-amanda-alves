import { describe, expect, it } from 'vitest';
import { formatPhone, normalizePhone } from '../src/phone.ts';

describe('normalizePhone', () => {
  it.each([
    ['(11) 98765-4321', '+5511987654321'],
    ['11987654321', '+5511987654321'],
    ['+55 11 98765-4321', '+5511987654321'],
    ['011 98765-4321', '+5511987654321'],
    ['(21) 3456-7890', '+552134567890'],
    ['+351 912 345 678', '+351912345678'],
  ])('%s → %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each(['', 'abc', '123', '(11) 8765-43210', '(00) 98765-4321'])('rejeita %s', (input) => {
    expect(normalizePhone(input)).toBeNull();
  });
});

describe('formatPhone', () => {
  it('formata número brasileiro', () => {
    expect(formatPhone('+5511987654321')).toBe('(11) 98765-4321');
    expect(formatPhone('+552134567890')).toBe('(21) 3456-7890');
  });
  it('mantém internacionais', () => {
    expect(formatPhone('+351912345678')).toBe('+351912345678');
  });
});
