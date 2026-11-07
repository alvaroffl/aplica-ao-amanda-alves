import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { mapMercadoPagoStatus, mpDate, verifyMercadoPagoSignature } from '../_shared/payments/mercadopago.ts';

const secret = 'segredo-de-teste';

function sign(dataId: string, requestId: string, ts: string) {
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  return createHmac('sha256', secret).update(manifest).digest('hex');
}

describe('webhook do Mercado Pago', () => {
  it('aceita assinatura válida', async () => {
    const v1 = sign('123456', 'req-1', '1700000000');
    expect(
      await verifyMercadoPagoSignature({ secret, signatureHeader: `ts=1700000000,v1=${v1}`, requestId: 'req-1', dataId: '123456' }),
    ).toBe(true);
  });

  it('rejeita assinatura adulterada, segredo ausente ou cabeçalho faltando', async () => {
    const v1 = sign('123456', 'req-1', '1700000000');
    expect(await verifyMercadoPagoSignature({ secret, signatureHeader: `ts=1700000000,v1=${v1}`, requestId: 'req-1', dataId: '999' })).toBe(false);
    expect(await verifyMercadoPagoSignature({ secret: '', signatureHeader: `ts=1,v1=${v1}`, requestId: 'req-1', dataId: '123456' })).toBe(false);
    expect(await verifyMercadoPagoSignature({ secret, signatureHeader: null, requestId: 'req-1', dataId: '123456' })).toBe(false);
  });

  it('mapeia status', () => {
    expect(mapMercadoPagoStatus('approved')).toBe('approved');
    expect(mapMercadoPagoStatus('in_process')).toBe('pending');
    expect(mapMercadoPagoStatus('charged_back')).toBe('refunded');
    expect(mapMercadoPagoStatus('rejected')).toBe('rejected');
  });

  it('formata data de expiração', () => {
    expect(mpDate(new Date('2026-11-07T10:00:00Z'))).toBe('2026-11-07T10:00:00.000+00:00');
  });
});
