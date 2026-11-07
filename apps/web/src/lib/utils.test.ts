import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyText, newIdempotencyKey } from './utils';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('newIdempotencyKey', () => {
  it('gera UUID v4', () => {
    expect(newIdempotencyKey()).toMatch(UUID_V4);
  });

  it('funciona sem crypto.randomUUID (página http aberta pelo IP da rede)', () => {
    const real = globalThis.crypto;
    vi.stubGlobal('crypto', { getRandomValues: real.getRandomValues.bind(real) });
    const a = newIdempotencyKey();
    const b = newIdempotencyKey();
    expect(a).toMatch(UUID_V4);
    expect(b).toMatch(UUID_V4);
    expect(a).not.toBe(b);
  });
});

describe('copyText', () => {
  it('usa o método antigo fora de contexto seguro e devolve o foco', async () => {
    vi.stubGlobal('isSecureContext', false);
    const button = document.createElement('button');
    document.body.appendChild(button);
    button.focus();
    let copied = '';
    const exec = vi.fn(() => {
      copied = (document.activeElement as HTMLTextAreaElement).value;
      return true;
    });
    Object.defineProperty(document, 'execCommand', { value: exec, configurable: true });

    await copyText('00020126pix');

    expect(exec).toHaveBeenCalledWith('copy');
    expect(copied).toBe('00020126pix');
    expect(document.querySelector('textarea')).toBeNull();
    expect(document.activeElement).toBe(button);
    button.remove();
  });

  it('falha de forma explícita se o navegador recusar a cópia', async () => {
    vi.stubGlobal('isSecureContext', false);
    Object.defineProperty(document, 'execCommand', { value: () => false, configurable: true });
    await expect(copyText('x')).rejects.toThrow();
    expect(document.querySelector('textarea')).toBeNull();
  });
});
