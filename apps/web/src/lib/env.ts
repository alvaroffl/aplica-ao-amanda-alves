export const env = {
  appName: import.meta.env.VITE_APP_NAME || 'Agendaê',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  turnstileSiteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY || '',
};

export const functionsUrl = `${env.supabaseUrl}/functions/v1`;
export const publicUrl = (path = '') => `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`;
