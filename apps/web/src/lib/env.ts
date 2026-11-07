/**
 * Aceita um caminho relativo (ex.: "/supabase"): a API passa a ser chamada na
 * mesma origem do app, pelo proxy do Vite. Assim um celular na rede local só
 * precisa alcançar a porta do front-end.
 */
function resolveSupabaseUrl(raw: string): string {
  const url = raw.replace(/\/+$/, '');
  return url.startsWith('/') ? `${window.location.origin}${url}` : url;
}

export const env = {
  appName: import.meta.env.VITE_APP_NAME || 'Agendaê',
  supabaseUrl: resolveSupabaseUrl(import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321'),
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  turnstileSiteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY || '',
  /** "live" só em produção com o gateway real; qualquer outro valor = modo de teste */
  paymentsTestMode: import.meta.env.VITE_PAYMENTS_MODE !== 'live',
};

export const functionsUrl = `${env.supabaseUrl}/functions/v1`;
export const publicUrl = (path = '') =>
  `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`;
