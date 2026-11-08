/** Leitura preguiçosa das variáveis de ambiente (nunca no import do módulo). */
function get(name: string, fallback = ''): string {
  return Deno.env.get(name) ?? fallback;
}

export function getEnv() {
  const appUrl = get('APP_URL', 'http://localhost:5173').replace(/\/$/, '');
  return {
    environment: get('ENVIRONMENT', 'development'),
    appName: get('APP_NAME', 'Amanda Alves'),
    appUrl,
    allowedOrigins: get('ALLOWED_ORIGINS', appUrl)
      .split(',')
      .map((o) => o.trim().replace(/\/$/, ''))
      .filter(Boolean),
    supabaseUrl: get('SUPABASE_URL'),
    serviceRoleKey: get('SUPABASE_SERVICE_ROLE_KEY') || get('SUPABASE_SECRET_KEY'),
    functionsPublicUrl: get(
      'FUNCTIONS_PUBLIC_URL',
      `${get('SUPABASE_PUBLIC_URL', 'http://127.0.0.1:54321')}/functions/v1`,
    ),
    turnstileSecret: get('TURNSTILE_SECRET_KEY'),
    rateLimitSalt: get('RATE_LIMIT_SALT', 'dev-only-salt'),
    // limites da reserva pública (por IP e por e-mail)
    bookingLimitIpPerMinute: Number(get('BOOKING_LIMIT_IP_PER_MINUTE', '10')),
    bookingLimitIpPerHour: Number(get('BOOKING_LIMIT_IP_PER_HOUR', '40')),
    bookingLimitEmailPerHour: Number(get('BOOKING_LIMIT_EMAIL_PER_HOUR', '8')),
    workerSecret: get('WORKER_SECRET'),
    paymentsProvider: get('PAYMENTS_PROVIDER', 'fake') as 'fake' | 'mercadopago',
    // "test" (padrão) = sandbox: as cobranças são marcadas como teste e o app avisa.
    // Só use "live" com credenciais de produção do gateway.
    paymentsMode: (get('PAYMENTS_MODE', 'test') === 'live' ? 'live' : 'test') as 'test' | 'live',
    mercadoPagoAccessToken: get('MERCADOPAGO_ACCESS_TOKEN'),
    mercadoPagoWebhookSecret: get('MERCADOPAGO_WEBHOOK_SECRET'),
    emailProvider: get('EMAIL_PROVIDER', 'log') as 'log' | 'resend' | 'mailpit',
    emailFrom: get('EMAIL_FROM', 'Amanda Alves <nao-responda@amandaalvespmu.com.br>'),
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
