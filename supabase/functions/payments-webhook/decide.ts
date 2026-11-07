import type { ProviderPayment } from '../_shared/payments/types.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type WebhookDecision =
  | { action: 'ignore'; reason: 'unknown_reference' | 'pending' | 'refunded' }
  | { action: 'reject_amount' }
  | { action: 'confirm' }
  | { action: 'fail'; status: 'rejected' | 'cancelled' };

/** external_reference do provedor = id da linha em public.payments. */
export function paymentRowId(payment: Pick<ProviderPayment, 'externalReference'>): string | null {
  const ref = payment.externalReference;
  return ref && UUID.test(ref) ? ref : null;
}

/**
 * O que fazer com o pagamento consultado na API do provedor (nunca com o corpo
 * do webhook). `expectedCents` é o valor do sinal gravado no nosso banco.
 */
export function decideWebhook(payment: ProviderPayment, expectedCents: number): WebhookDecision {
  switch (payment.status) {
    case 'approved':
      // valor menor que o sinal cobrado = possível adulteração: não confirma
      return payment.amountCents < expectedCents
        ? { action: 'reject_amount' }
        : { action: 'confirm' };
    case 'rejected':
    case 'cancelled':
      return { action: 'fail', status: payment.status };
    case 'refunded':
      return { action: 'ignore', reason: 'refunded' };
    default:
      return { action: 'ignore', reason: 'pending' };
  }
}
