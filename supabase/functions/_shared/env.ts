/** Leitura preguiçosa das variáveis de ambiente (nunca no import do módulo). */
function get(name: string, fallback = ''): string {
  return Deno.env.get(name) ?? fallback;
}

export function getEnv() {
  const appUrl = get('APP_URL', 'http://localhost:5173').replace(/\/$/, '');
  return {
    environment: get('ENVIRONMENT', 'development'),
    appName: get('APP_NAME', 'Agendaê'),
    appUrl,
    allowedOrigins: get('ALLOWED_ORIGINS', appUrl)
      .split(',')
      .map((o) => o.trim().replace(/\/$/, ''))
      .filter(Boolean),
    supabaseUrl: get('SUPABASE_URL'),
    serviceRoleKey: get('SUPABASE_SERVICE_ROLE_KEY') || get('SUPABASE_SECRET_KEY'),
    functionsPublicUrl: get('FUNCTIONS_PUBLIC_URL', `${get('SUPABASE_PUBLIC_URL', 'http://127.0.0.1:54321')}/functions/v1`),
    turnstileSecret: get('TURNSTILE_SECRET_KEY'),
    rateLimitSalt: get('RATE_LIMIT_SALT', 'dev-only-salt'),
    workerSecret: get('WORKER_SECRET'),
    paymentsProvider: get('PAYMENTS_PROVIDER', 'fake') as 'fake' | 'mercadopago',
    mercadoPagoAccessToken: get('MERCADOPAGO_ACCESS_TOKEN'),
    mercadoPagoWebhookSecret: get('MERCADOPAGO_WEBHOOK_SECRET'),
    emailProvider: get('EMAIL_PROVIDER', 'log') as 'log' | 'resend' | 'mailpit',
    emailFrom: get('EMAIL_FROM', 'Agendaê <nao-responda@agendae.dev>'),
    resendApiKey: get('RESEND_API_KEY'),
    mailpitUrl: get('MAILPIT_URL', 'http://inbucket:8025'),
    whatsappProvider: get('WHATSAPP_PROVIDER', 'log') as 'log' | 'meta',
    whatsappToken: get('WHATSAPP_TOKEN'),
    whatsappPhoneNumberId: get('WHATSAPP_PHONE_NUMBER_ID'),
    whatsappApiVersion: get('WHATSAPP_API_VERSION', 'v21.0'),
    whatsappTemplateLang: get('WHATSAPP_TEMPLATE_LANG', 'pt_BR'),
  };
}

export type Env = ReturnType<typeof getEnv>;
export const isProduction = () => getEnv().environment === 'production';
