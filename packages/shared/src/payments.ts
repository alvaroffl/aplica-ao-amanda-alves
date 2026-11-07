/**
 * Rótulo do meio de pagamento para o painel e os e-mails (pt-BR).
 * `detail` é o tipo informado pelo provedor (payment_type_id do Mercado Pago).
 */
export function paymentMethodLabel(
  method: 'pix' | 'card',
  detail?: string | null,
  installments?: number | null,
): string {
  if (method === 'pix' || detail === 'bank_transfer') return 'Pix';
  const parcelas = installments && installments > 1 ? ` em ${installments}x` : '';
  switch (detail) {
    case 'debit_card':
      return 'Cartão de débito';
    case 'prepaid_card':
      return 'Cartão pré-pago';
    case 'account_money':
      return 'Saldo Mercado Pago';
    case 'digital_wallet':
      return 'Carteira digital';
    case 'credit_card':
      return `Cartão de crédito${parcelas}`;
    default:
      return `Cartão${parcelas}`;
  }
}

/** Valor a devolver pela política (mesma regra de cancel_booking_by_token). */
export function policyRefundCents(
  amountCents: number,
  refundedCents: number,
  refundPercent: number,
): number {
  const remaining = Math.max(0, amountCents - refundedCents);
  return Math.round((remaining * Math.min(100, Math.max(0, refundPercent))) / 100);
}
