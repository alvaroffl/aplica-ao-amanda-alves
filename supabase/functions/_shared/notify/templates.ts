import {
  buildIcs,
  formatLongDate,
  formatPhone,
  formatMoney,
  formatTime,
  googleCalendarUrl,
  paymentMethodLabel,
  timeZoneLabel,
  type PublicBooking,
} from '../../../../packages/shared/src/index.ts';

export type TemplateName =
  | 'booking_confirmed'
  | 'booking_rescheduled'
  | 'booking_cancelled'
  | 'reminder_24h'
  | 'reminder_2h'
  | 'member_invite';

export interface NotificationContext {
  notification: {
    id: string;
    template: string;
    channel: 'email' | 'whatsapp';
    recipient: string;
    payload: Record<string, unknown>;
  };
  booking: PublicBooking | null;
  business: {
    id: string;
    name: string;
    slug: string;
    phone: string | null;
    email: string | null;
    timezone: string;
  };
}

export interface RenderOptions {
  appUrl: string;
  appName: string;
}

export interface EmailMessage {
  subject: string;
  html: string;
  text: string;
  attachment?: { filename: string; content: string; contentType: string };
}

export interface WhatsAppMessage {
  template: string;
  params: string[];
  preview: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** Decide se a notificação ainda faz sentido no momento do envio. */
export function shouldSkip(ctx: NotificationContext): string | null {
  const t = ctx.notification.template;
  if (t === 'member_invite') return null;
  const b = ctx.booking;
  if (!b) return 'booking_missing';
  if (t === 'booking_cancelled') return b.status === 'cancelled' ? null : 'not_cancelled';
  if (b.status !== 'confirmed') return 'booking_not_confirmed';
  if (t === 'reminder_24h' || t === 'reminder_2h') {
    const scheduledStart = ctx.notification.payload?.starts_at as string | undefined;
    if (scheduledStart && new Date(scheduledStart).getTime() !== new Date(b.starts_at).getTime()) {
      return 'rescheduled';
    }
    if (new Date(b.starts_at).getTime() <= Date.now()) return 'already_started';
  }
  return null;
}

/** Política da clínica em uma frase (regras configuráveis + observação livre). */
export function describePolicy(b: PublicBooking): string {
  const p = b.business.policy;
  if (!p) return '';
  const parts: string[] = [];
  if (p.client_can_reschedule) {
    parts.push(`Você pode remarcar pelo link até ${p.reschedule_min_hours}h antes do horário.`);
  }
  if (b.deposit_cents > 0) {
    parts.push(
      p.refund_percent > 0
        ? `Cancelando até ${p.refund_min_hours}h antes, ${p.refund_percent === 100 ? 'o sinal é devolvido' : `${p.refund_percent}% do sinal é devolvido`}; depois disso, não há devolução.`
        : 'O sinal não é reembolsável.',
    );
  }
  if (p.notes) parts.push(p.notes);
  return parts.join(' ');
}

/** Comprovante do sinal (pagamentos aprovados ou estornados). */
export function paymentReceipt(b: PublicBooking): { title: string; lines: string[] } | null {
  const pay = b.payment;
  if (!pay || !['approved', 'refund_pending', 'refunded'].includes(pay.status)) return null;
  const lines = [
    `Valor do sinal: ${formatMoney(pay.amount_cents)}`,
    `Forma de pagamento: ${paymentMethodLabel(pay.method, pay.method_detail, pay.installments)}`,
  ];
  if (b.price_cents > pay.amount_cents) {
    lines.push(`Restante a pagar no atendimento: ${formatMoney(b.price_cents - pay.amount_cents)}`);
  }
  if (pay.refunded_cents > 0) lines.push(`Valor devolvido: ${formatMoney(pay.refunded_cents)}`);
  else if (pay.status === 'refund_pending') lines.push('Devolução do sinal em processamento.');
  if (pay.provider_payment_id) lines.push(`Código da transação: ${pay.provider_payment_id}`);
  if (pay.test_mode) lines.push('MODO DE TESTE: nenhuma cobrança real foi feita.');
  return { title: 'Comprovante do sinal', lines };
}

function details(b: PublicBooking) {
  const tz = b.unit.timezone;
  return {
    date: formatLongDate(b.starts_at, tz),
    time: formatTime(b.starts_at, tz),
    tzLabel: timeZoneLabel(tz, 'pt-BR', new Date(b.starts_at)),
    shortWhen: `${formatLongDate(b.starts_at, tz)} às ${formatTime(b.starts_at, tz)}`,
  };
}

const headlines: Record<Exclude<TemplateName, 'member_invite'>, (biz: string) => string> = {
  booking_confirmed: (biz) => `Seu horário em ${biz} está confirmado`,
  booking_rescheduled: (biz) => `Seu horário em ${biz} foi reagendado`,
  booking_cancelled: (biz) => `Seu horário em ${biz} foi cancelado`,
  reminder_24h: (biz) => `Lembrete: amanhã você tem horário em ${biz}`,
  reminder_2h: (biz) => `Lembrete: daqui a pouco você tem horário em ${biz}`,
};

function layout(title: string, bodyHtml: string, appName: string): string {
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#18181b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;padding:28px">
<tr><td>
<h1 style="font-size:20px;line-height:1.3;margin:0 0 16px">${escapeHtml(title)}</h1>
${bodyHtml}
</td></tr></table>
<p style="font-size:12px;color:#71717a;margin-top:16px">Enviado por ${escapeHtml(appName)} · Mensagem automática, não responda.</p>
</td></tr></table></body></html>`;
}

function button(href: string, label: string, primary = true): string {
  const style = primary ? 'background:#4f46e5;color:#ffffff' : 'background:#eef2ff;color:#3730a3';
  return `<a href="${escapeHtml(href)}" style="${style};display:inline-block;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:600;margin:4px 8px 4px 0">${escapeHtml(label)}</a>`;
}

export function renderEmail(ctx: NotificationContext, opts: RenderOptions): EmailMessage {
  const t = ctx.notification.template as TemplateName;

  if (t === 'member_invite') {
    const link = `${opts.appUrl}/cadastro?email=${encodeURIComponent(ctx.notification.recipient)}`;
    const subject = `Convite para a equipe de ${ctx.business.name}`;
    const html = layout(
      subject,
      `<p>Você foi convidado(a) para acessar a agenda de <strong>${escapeHtml(ctx.business.name)}</strong> no ${escapeHtml(opts.appName)}.</p>
       <p>Crie sua conta com este e-mail para entrar:</p>${button(link, 'Criar minha conta')}`,
      opts.appName,
    );
    const text = `${subject}\n\nCrie sua conta com este e-mail para acessar: ${link}`;
    return { subject, html, text };
  }

  const b = ctx.booking!;
  const d = details(b);
  const manageUrl = `${opts.appUrl}/r/${b.manage_token}`;
  const title = headlines[t](b.business.name);
  const where = [b.unit.name, b.unit.address].filter(Boolean).join(' — ');
  const calendar = googleCalendarUrl({
    start: b.starts_at,
    end: b.ends_at,
    title: `${b.service.name} — ${b.business.name}`,
    description: `Com ${b.professional.name}. Gerenciar: ${manageUrl}`,
    location: where,
  });

  const subjects: Record<Exclude<TemplateName, 'member_invite'>, string> = {
    booking_confirmed: `Confirmado: ${b.service.name} em ${d.shortWhen}`,
    booking_rescheduled: `Reagendado: ${b.service.name} em ${d.shortWhen}`,
    booking_cancelled: `Cancelado: ${b.service.name} em ${d.shortWhen}`,
    reminder_24h: `Amanhã às ${d.time}: ${b.service.name}`,
    reminder_2h: `Hoje às ${d.time}: ${b.service.name}`,
  };

  const summary = `
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#fafafa;border-radius:12px;padding:16px;margin:8px 0 20px">
      <tr><td style="padding:4px 0"><strong>${escapeHtml(b.service.name)}</strong> com ${escapeHtml(b.professional.name)}</td></tr>
      <tr><td style="padding:4px 0">${escapeHtml(d.date)} às <strong>${escapeHtml(d.time)}</strong></td></tr>
      <tr><td style="padding:4px 0;color:#52525b;font-size:13px">${escapeHtml(d.tzLabel)}</td></tr>
      ${where ? `<tr><td style="padding:4px 0">${escapeHtml(where)}</td></tr>` : ''}
    </table>`;

  const greeting = `<p>Olá, ${escapeHtml(firstName(b.client.name))}!</p>`;
  const cancelled = t === 'booking_cancelled';
  const actions = cancelled
    ? button(`${opts.appUrl}/${b.business.slug}`, 'Agendar novo horário')
    : `${button(manageUrl, 'Ver, reagendar ou cancelar')}${button(calendar, 'Adicionar ao Google Agenda', false)}`;
  const policyText = cancelled ? '' : describePolicy(b);
  const policy = policyText
    ? `<p style="font-size:13px;color:#52525b">${escapeHtml(policyText)}</p>`
    : '';
  const receipt = paymentReceipt(b);
  const receiptHtml = receipt
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e7e0da;border-radius:12px;padding:16px;margin:0 0 20px">
        <tr><td style="padding:2px 0;font-weight:600">${escapeHtml(receipt.title)}</td></tr>
        ${receipt.lines.map((l) => `<tr><td style="padding:2px 0;font-size:14px">${escapeHtml(l)}</td></tr>`).join('')}
      </table>`
    : '';
  const contact = b.business.phone
    ? `<p style="font-size:13px;color:#52525b">Dúvidas? Fale com ${escapeHtml(b.business.name)}: ${escapeHtml(formatPhone(b.business.phone))}</p>`
    : '';

  const html = layout(
    title,
    `${greeting}${summary}${receiptHtml}${actions}${policy}${contact}`,
    opts.appName,
  );
  const text = [
    `Olá, ${firstName(b.client.name)}!`,
    title,
    `${b.service.name} com ${b.professional.name}`,
    `${d.date} às ${d.time} (${d.tzLabel})`,
    where,
    ...(receipt ? ['', receipt.title, ...receipt.lines, ''] : []),
    policyText,
    cancelled ? `Agendar novamente: ${opts.appUrl}/${b.business.slug}` : `Gerenciar: ${manageUrl}`,
  ]
    .filter(Boolean)
    .join('\n');

  const ics = buildIcs(
    {
      uid: `${b.id}@agendae`,
      start: b.starts_at,
      end: b.ends_at,
      title: `${b.service.name} — ${b.business.name}`,
      description: `Com ${b.professional.name}. Gerenciar: ${manageUrl}`,
      location: where,
      url: manageUrl,
      status: cancelled ? 'CANCELLED' : 'CONFIRMED',
      sequence: Math.floor(Date.now() / 1000),
    },
    opts.appName,
  );

  return {
    subject: subjects[t],
    html,
    text,
    attachment: {
      filename: 'agendamento.ics',
      content: ics,
      contentType: 'text/calendar; charset=utf-8',
    },
  };
}

/**
 * Templates de WhatsApp (categoria UTILIDADE) que precisam estar aprovados na Meta.
 * Corpo sugerido em README → "WhatsApp".
 */
export const WHATSAPP_TEMPLATES: Record<Exclude<TemplateName, 'member_invite'>, string> = {
  booking_confirmed: 'agendamento_confirmado',
  booking_rescheduled: 'agendamento_reagendado',
  booking_cancelled: 'agendamento_cancelado',
  reminder_24h: 'lembrete_agendamento',
  reminder_2h: 'lembrete_agendamento',
};

export function renderWhatsApp(
  ctx: NotificationContext,
  opts: RenderOptions,
): WhatsAppMessage | null {
  const t = ctx.notification.template as TemplateName;
  if (t === 'member_invite' || !ctx.booking) return null;
  const b = ctx.booking;
  const d = details(b);
  const manageUrl = `${opts.appUrl}/r/${b.manage_token}`;
  const params = [
    firstName(b.client.name),
    b.business.name,
    b.service.name,
    `${d.date} às ${d.time} (${d.tzLabel})`,
    t === 'booking_cancelled' ? `${opts.appUrl}/${b.business.slug}` : manageUrl,
  ];
  const preview = `${headlines[t](b.business.name)}: ${b.service.name}, ${params[3]}. ${params[4]}`;
  return { template: WHATSAPP_TEMPLATES[t], params, preview };
}
