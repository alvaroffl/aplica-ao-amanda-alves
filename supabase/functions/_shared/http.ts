import { getEnv } from './env.ts';
import type { ErrorCode } from '../../../packages/shared/src/index.ts';

export function corsHeaders(origin: string | null): Record<string, string> {
  const { allowedOrigins, environment } = getEnv();
  const allowed =
    origin &&
    (allowedOrigins.includes(origin) ||
      (environment !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)))
      ? origin
      : (allowedOrigins[0] ?? '');
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export function preflight(req: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}

export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...corsHeaders(req.headers.get('origin')),
    },
  });
}

export function fail(
  req: Request,
  code: ErrorCode | 'METHOD_NOT_ALLOWED' | 'UNAUTHORIZED',
  status: number,
  details?: unknown,
): Response {
  return json(req, { error: { code, details } }, status);
}

/** IP do cliente (primeiro valor de X-Forwarded-For, definido pelo gateway). */
export function clientIp(req: Request): string {
  return (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

/** Log estruturado, sem dados pessoais. */
export function log(
  level: 'info' | 'warn' | 'error',
  event: string,
  data: Record<string, unknown> = {},
) {
  console[level === 'info' ? 'log' : level](
    JSON.stringify({ level, event, ...data, at: new Date().toISOString() }),
  );
}
