import { errorCodeFrom } from '@agendae/shared/errors';
import { ApiError, isUnavailable } from './api';
import { env } from './env';

/**
 * Chamada RPC leve (PostgREST) para as páginas públicas, sem carregar o
 * supabase-js — reduz o JavaScript inicial no celular.
 */
export async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${env.supabaseUrl}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: env.supabaseAnonKey },
      body: JSON.stringify(args),
    });
  } catch {
    throw new ApiError('NETWORK');
  }
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // resposta que não é da API (ex.: proxy sem o Supabase no ar)
  }
  if (!res.ok) {
    if (isUnavailable(res.status, data !== null)) throw new ApiError('UNAVAILABLE', res.status);
    throw new ApiError(errorCodeFrom(data), res.status);
  }
  return data as T;
}
