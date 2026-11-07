import type { CreatePaymentInput, CreatePaymentResult, PaymentProvider, ProviderPayment } from './types.ts';

/**
 * Provedor de DESENVOLVIMENTO: gera um "Pix" fictício e permite simular a
 * aprovação pela Edge Function dev-payments. Bloqueado em produção.
 */
export class FakeProvider implements PaymentProvider {
  readonly name = 'fake';

  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const code = `00020126580014BR.GOV.BCB.PIX0136${input.paymentId}5204000053039865406${(input.amountCents / 100).toFixed(2)}5802BR5913AGENDAE TESTE6009SAO PAULO62070503***6304FAKE`;
    return Promise.resolve({
      providerPaymentId: `fake-${input.paymentId}`,
      pixQrCode: input.method === 'pix' ? code : null,
      checkoutUrl: null,
      raw: { fake: true },
    });
  }

  getPayment(providerPaymentId: string): Promise<ProviderPayment> {
    return Promise.resolve({
      providerPaymentId,
      externalReference: providerPaymentId.replace(/^fake-/, ''),
      status: 'approved',
      amountCents: 0,
      raw: { fake: true },
    });
  }

  refund(): Promise<void> {
    return Promise.resolve();
  }
}
