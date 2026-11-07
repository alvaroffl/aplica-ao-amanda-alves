import { getEnv, isProduction } from '../env.ts';
import { FakeProvider } from './fake.ts';
import { MercadoPagoProvider } from './mercadopago.ts';
import type { PaymentProvider } from './types.ts';

/** Cobranças de teste: provedor fictício ou gateway em sandbox (PAYMENTS_MODE=test). */
export function isTestMode(provider = getEnv().paymentsProvider): boolean {
  return provider === 'fake' || getEnv().paymentsMode !== 'live';
}

export function paymentProvider(name = getEnv().paymentsProvider): PaymentProvider {
  if (name === 'mercadopago') return new MercadoPagoProvider(getEnv().mercadoPagoAccessToken);
  if (isProduction()) throw new Error('Provedor de pagamento "fake" não é permitido em produção');
  return new FakeProvider();
}

export type { PaymentProvider } from './types.ts';
