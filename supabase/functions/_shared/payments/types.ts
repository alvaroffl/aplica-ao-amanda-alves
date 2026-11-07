export type ProviderPaymentStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded';

export interface CreatePaymentInput {
  /** id da linha em public.payments (vira external_reference e chave de idempotência) */
  paymentId: string;
  bookingId: string;
  amountCents: number;
  method: 'pix' | 'card';
  /** máximo de parcelas no cartão de crédito (1 = à vista) */
  maxInstallments: number;
  description: string;
  payer: { name: string; email: string | null };
  expiresAt: Date;
  notificationUrl: string;
  returnUrl: string;
}

export interface CreatePaymentResult {
  providerPaymentId: string | null;
  pixQrCode?: string | null;
  pixQrCodeBase64?: string | null;
  checkoutUrl?: string | null;
  raw: unknown;
}

export interface ProviderPayment {
  providerPaymentId: string;
  externalReference: string | null;
  status: ProviderPaymentStatus;
  amountCents: number;
  /** resumo seguro do pagamento (sem dados de cartão), gravado em payments.raw */
  raw: {
    id: string | number;
    status: string;
    payment_type_id?: string | null;
    payment_method_id?: string | null;
    installments?: number | null;
    live_mode?: boolean | null;
    [key: string]: unknown;
  };
}

export interface PaymentProvider {
  readonly name: string;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  getPayment(providerPaymentId: string): Promise<ProviderPayment>;
  refund(providerPaymentId: string, amountCents: number, idempotencyKey: string): Promise<void>;
}
