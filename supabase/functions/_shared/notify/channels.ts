import type { Env } from '../env.ts';
import type { EmailMessage, WhatsAppMessage } from './templates.ts';

export interface SendResult {
  providerMessageId: string | null;
}

function parseFrom(from: string): { name: string; email: string } {
  const m = /^(.*)<(.+)>$/.exec(from.trim());
  return m ? { name: m[1]!.trim(), email: m[2]!.trim() } : { name: '', email: from.trim() };
}

function toBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export async function sendEmail(env: Env, to: string, msg: EmailMessage): Promise<SendResult> {
  switch (env.emailProvider) {
    case 'resend': {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: env.emailFrom,
          to: [to],
          subject: msg.subject,
          html: msg.html,
          text: msg.text,
          attachments: msg.attachment
            ? [{ filename: msg.attachment.filename, content: toBase64(msg.attachment.content) }]
            : undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(`Resend ${res.status}: ${JSON.stringify(body).slice(0, 300)}`);
      return { providerMessageId: (body as { id?: string }).id ?? null };
    }
    case 'mailpit': {
      // Desenvolvimento: o e-mail aparece em http://127.0.0.1:54324
      const from = parseFrom(env.emailFrom);
      const res = await fetch(`${env.mailpitUrl}/api/v1/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          From: { Email: from.email, Name: from.name },
          To: [{ Email: to }],
          Subject: msg.subject,
          HTML: msg.html,
          Text: msg.text,
          Attachments: msg.attachment
            ? [{ Content: toBase64(msg.attachment.content), Filename: msg.attachment.filename, ContentType: 'text/calendar' }]
            : undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(`Mailpit ${res.status}: ${JSON.stringify(body).slice(0, 300)}`);
      return { providerMessageId: (body as { ID?: string }).ID ?? null };
    }
    default:
      console.log(JSON.stringify({ level: 'info', event: 'email.log_driver', subject: msg.subject }));
      return { providerMessageId: null };
  }
}

export async function sendWhatsApp(env: Env, toE164: string, msg: WhatsAppMessage): Promise<SendResult> {
  if (env.whatsappProvider !== 'meta') {
    console.log(JSON.stringify({ level: 'info', event: 'whatsapp.log_driver', template: msg.template }));
    return { providerMessageId: null };
  }
  const res = await fetch(
    `https://graph.facebook.com/${env.whatsappApiVersion}/${env.whatsappPhoneNumberId}/messages`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.whatsappToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: toE164.replace(/\D/g, ''),
        type: 'template',
        template: {
          name: msg.template,
          language: { code: env.whatsappTemplateLang },
          components: [{ type: 'body', parameters: msg.params.map((text) => ({ type: 'text', text })) }],
        },
      }),
    },
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`WhatsApp ${res.status}: ${JSON.stringify(body).slice(0, 300)}`);
  return { providerMessageId: (body as { messages?: { id: string }[] }).messages?.[0]?.id ?? null };
}
