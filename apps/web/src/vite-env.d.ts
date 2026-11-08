/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_PAYMENTS_MODE?: 'test' | 'live';
  readonly VITE_WHATSAPP_CTA?: string;
  readonly VITE_CLINIC_SLUG?: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
