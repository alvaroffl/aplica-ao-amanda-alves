import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProvider,
  ProviderPayment,
  ProviderPaymentStatus,
} from './types.ts';
import { hmacSha256Hex, safeEqual } from '../crypto.ts';

const API = 'https://api.mercadopago.com';

/** Mapeia os status do Mercado Pago para o nosso modelo. */
export function mapMercadoPagoStatus(status: string): ProviderPaymentStatus {
  switch (status) {
    case 'approved':
      return 'approved';
    case 'rejected':
      return 'rejected';
    case 'cancelled':
      return 'cancelled';
    case 'refunded':
    case 'charged_back':
      return 'refunded';
    default:
      return 'pending'; // pending, in_process, authorized, in_mediation
  }
}

/** Data no formato aceito pelo MP: 2026-11-07T10:00:00.000+00:00 */
export function mpDate(date: Date): string {
  return date.toISOString().replace('Z', '+00:00');
}

/**
 * Valida a assinatura do webhook (cabeçalho x-signature: "ts=...,v1=...").
 * Manifesto: id:<data.id>;request-id:<x-request-id>;ts:<ts>;
 */
export async function verifyMercadoPagoSignature(params: {
  secret: string;
  signatureHeader: string | null;
  requestId: string | null;
  dataId: string | null;
}): Promise<boolean> {
  const { secret, signatureHeader, requestId, dataId } = params;
  if (!secret || !signatureHeader || !dataId) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((p) => {
      const [k, ...v] = p.trim().split('=');
      return [k, v.join('=')];
    }),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;
  const id = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId;
  let manifest = `id:${id};`;
  if (requestId) manifest += `request-id:${requestId};`;
  manifest += `ts:${ts};`;
  const expected = await hmacSha256Hex(secret, manifest);
  return safeEqual(expected, v1);
}

export class MercadoPagoProvider implements PaymentProvider {
  readonly name = 'mercadopago';
  constructor(private readonly accessToken: string) {
    if (!accessToken) throw new Error('MERCADOPAGO_ACCESS_TOKEN ausente');
  }

  private async request<T>(path: string, init: RequestInit & { idempotencyKey?: string } = {}): Promise<T> {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...(init.idempotencyKey ? { 'X-Idempotency-Key': init.idempotencyKey } : {}),
        ...(init.headers ?? {}),
      },
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Mercado Pago ${res.status}: ${text.slice(0, 500)}`);
    return (text ? JSON.parse(text) : {}) as T;
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const amount = Number((input.amountCents / 100).toFixed(2));
    const [firstName, ...rest] = input.payer.name.trim().split(/\s+/);

    if (input.method === 'pix') {
      const payment = await this.request<{
        id: number;
        point_of_interaction?: { transaction_data?: { qr_code?: string; qr_code_base64?: string; ticket_url?: string } };
      }>('/v1/payments', {
        method: 'POST',
        idempotencyKey: input.paymentId,
        body: JSON.stringify({
          transaction_amount: amount,
          description: input.description,
          payment_method_id: 'pix',
          external_reference: input.paymentId,
          notification_url: input.notificationUrl,
          date_of_expiration: mpDate(input.expiresAt),
          payer: { email: input.payer.email ?? undefined, first_name: firstName, last_name: rest.join(' ') || undefined },
        }),
      });
      const tx = payment.point_of_interaction?.transaction_data;
      return {
        providerPaymentId: String(payment.id),
        pixQrCode: tx?.qr_code ?? null,
        pixQrCodeBase64: tx?.qr_code_base64 ?? null,
        checkoutUrl: tx?.ticket_url ?? null,
        raw: { id: payment.id },
      };
    }

    // Cartão: Checkout Pro (página segura do Mercado Pago, sem dados de cartão aqui — PCI)
    const preference = await this.request<{ id: string; init_point: string }>('/checkout/preferences', {
      method: 'POST',
      idempotencyKey: input.paymentId,
      body: JSON.stringify({
        items: [{ title: input.description, quantity: 1, unit_price: amount, currency_id: 'BRL' }],
        payer: { name: firstName, surname: rest.join(' ') || undefined, email: input.payer.email ?? undefined },
        external_reference: input.paymentId,
        notification_url: input.notificationUrl,
        back_urls: { success: input.returnUrl, failure: input.returnUrl, pending: input.returnUrl },
        auto_return: 'approved',
        payment_methods: { excluded_payment_types: [{ id: 'ticket' }, { id: 'atm' }], installments: 1 },
        expires: true,
        expiration_date_to: mpDate(input.expiresAt),
      }),
    });
    return { providerPaymentId: null, checkoutUrl: preference.init_point, raw: { preference_id: preference.id } };
  }

  async getPayment(providerPaymentId: string): Promise<ProviderPayment> {
    const p = await this.request<{
      id: number;
      status: string;
      external_reference: string | null;
      transaction_amount: number;
    }>(`/v1/payments/${encodeURIComponent(providerPaymentId)}`);
    return {
      providerPaymentId: String(p.id),
      externalReference: p.external_reference,
      status: mapMercadoPagoStatus(p.status),
      amountCents: Math.round(p.transaction_amount * 100),
      raw: { id: p.id, status: p.status },
    };
  }

  async refund(providerPaymentId: string, amountCents: number, idempotencyKey: string): Promise<void> {
    await this.request(`/v1/payments/${encodeURIComponent(providerPaymentId)}/refunds`, {
      method: 'POST',
      idempotencyKey: `refund-${idempotencyKey}`,
      body: JSON.stringify({ amount: Number((amountCents / 100).toFixed(2)) }),
    });
  }
}
