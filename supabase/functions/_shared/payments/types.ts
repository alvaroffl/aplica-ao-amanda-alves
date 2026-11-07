export type ProviderPaymentStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded';

export interface CreatePaymentInput {
  /** id da linha em public.payments (vira external_reference e chave de idempotência) */
  paymentId: string;
  bookingId: string;
  amountCents: number;
  method: 'pix' | 'card';
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
  raw: unknown;
}

export interface PaymentProvider {
  readonly name: string;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  getPayment(providerPaymentId: string): Promise<ProviderPayment>;
  refund(providerPaymentId: string, amountCents: number, idempotencyKey: string): Promise<void>;
}
