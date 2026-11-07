import { getEnv, isProduction } from './env.ts';
import { log } from './http.ts';
import { sha256Hex } from './crypto.ts';
import type { ServiceClient } from './supabase.ts';

/** Rate limit de janela fixa no Postgres. Chaves são hasheadas (LGPD). */
export async function allow(db: ServiceClient, key: string, max: number, windowSeconds: number): Promise<boolean> {
  const hashed = await sha256Hex(`${getEnv().rateLimitSalt}:${key}`);
  const { data, error } = await db.rpc('check_rate_limit', {
    p_key: hashed,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    log('error', 'rate_limit.error', { message: error.message });
    return !isProduction(); // falha fechada em produção
  }
  return data === true;
}

/** Valida o token do Cloudflare Turnstile no servidor. */
export async function verifyCaptcha(token: string, ip: string): Promise<boolean> {
  const { turnstileSecret } = getEnv();
  if (!turnstileSecret) {
    if (isProduction()) {
      log('error', 'captcha.missing_secret');
      return false;
    }
    return true; // desenvolvimento local sem captcha
  }
  if (!token) return false;
  try {
    const body = new FormData();
    body.append('secret', turnstileSecret);
    body.append('response', token);
    if (ip !== 'unknown') body.append('remoteip', ip);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const result = (await res.json()) as { success?: boolean };
    return result.success === true;
  } catch (e) {
    log('error', 'captcha.verify_error', { message: String(e) });
    return false;
  }
}
