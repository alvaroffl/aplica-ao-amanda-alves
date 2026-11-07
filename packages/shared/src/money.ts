export function formatMoney(cents: number, currency = 'BRL', locale = 'pt-BR'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);
}

/**
 * Converte texto digitado ("90", "90,5", "1.234,56", "R$ 45,00") em centavos.
 * Retorna null se inválido.
 */
export function parseMoneyToCents(input: string | number): number | null {
  if (typeof input === 'number') {
    return Number.isFinite(input) && input >= 0 ? Math.round(input * 100) : null;
  }
  const cleaned = input.replace(/[^\d,.-]/g, '').trim();
  if (!cleaned) return null;
  let normalized = cleaned;
  if (cleaned.includes(',')) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  }
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

export type DepositType = 'none' | 'fixed' | 'percent';

/** Espelha public.compute_deposit no banco. */
export function computeDeposit(priceCents: number, type: DepositType, value: number): number {
  if (type === 'fixed') return Math.min(value, priceCents);
  if (type === 'percent') return Math.round((priceCents * value) / 100);
  return 0;
}
