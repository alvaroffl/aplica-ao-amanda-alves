import { errorCodeFrom } from '@agendae/shared/errors';
import { ApiError } from './api';
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
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(errorCodeFrom(data), res.status);
  return data as T;
}
