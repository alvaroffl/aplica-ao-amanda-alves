import { errorCodeFrom, type ErrorCode } from '@agendae/shared/errors';
import { env, functionsUrl } from './env';

/** Erro de API com código de negócio (traduzido via i18n "errors.<code>"). */
export class ApiError extends Error {
  constructor(
    public readonly code: ErrorCode | 'NETWORK',
    public readonly status = 0,
    public readonly details?: unknown,
  ) {
    super(code);
    this.name = 'ApiError';
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof TypeError) return new ApiError('NETWORK');
  return new ApiError(errorCodeFrom(error));
}

/** Chama uma Edge Function (POST JSON). */
export async function callFunction<T>(name: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${functionsUrl}/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: env.supabaseAnonKey },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError('NETWORK');
  }
  const data = (await res.json().catch(() => null)) as {
    error?: { code: ErrorCode; details?: unknown };
  } | null;
  if (!res.ok) {
    throw new ApiError(data?.error?.code ?? 'INTERNAL_ERROR', res.status, data?.error?.details);
  }
  return data as T;
}

/**
 * Desembrulha o retorno do supabase-js lançando ApiError.
 * Consultas de lista/single bem-sucedidas sempre trazem dados.
 */
export function unwrap<R extends { data: unknown; error: unknown }>(
  result: R,
): NonNullable<R['data']> {
  if (result.error) throw toApiError(result.error);
  return result.data as NonNullable<R['data']>;
}

/** Igual a unwrap, mas preserva null (para .maybeSingle() e RPCs opcionais). */
export function unwrapMaybe<R extends { data: unknown; error: unknown }>(result: R): R['data'] {
  if (result.error) throw toApiError(result.error);
  return result.data;
}
