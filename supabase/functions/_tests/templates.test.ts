import { describe, expect, it } from 'vitest';
import type { PublicBooking } from '../../../packages/shared/src/index.ts';
import { renderEmail, renderWhatsApp, shouldSkip, type NotificationContext } from '../_shared/notify/templates.ts';

const booking: PublicBooking = {
  id: '11111111-1111-1111-1111-111111111111',
  status: 'confirmed',
  starts_at: '2030-11-18T17:30:00Z',
  ends_at: '2030-11-18T18:30:00Z',
  price_cents: 9000,
  deposit_cents: 0,
  hold_expires_at: null,
  notes: null,
  cancelled_at: null,
  cancelled_by: null,
  manage_token: 'abc.def',
  business: { id: 'b', name: 'Studio <Exemplo>', slug: 'studio', phone: '+5511988887777', email: null, logo_url: null, cancellation_window_hours: 24 },
  service: { id: 's', name: 'Corte feminino', duration_min: 60 },
  professional: { id: 'p', name: 'Carla' },
  unit: { id: 'u', name: 'Centro', address: 'Rua A, 1', timezone: 'America/Sao_Paulo' },
  client: { name: 'Mariana Costa', email: 'm@ex.dev', phone: '+5511912345678' },
  payment: null,
};

function ctx(template: string, overrides: Partial<PublicBooking> = {}, payload: Record<string, unknown> = {}): NotificationContext {
  return {
    notification: { id: 'n', template, channel: 'email', recipient: 'm@ex.dev', payload },
    booking: { ...booking, ...overrides },
    business: { id: 'b', name: 'Studio', slug: 'studio', phone: null, email: null, timezone: 'America/Sao_Paulo' },
  };
}

const opts = { appUrl: 'https://app.test', appName: 'Agendaê' };

describe('templates de e-mail', () => {
  it('confirmação: horário no fuso da unidade, link seguro e .ics', () => {
    const email = renderEmail(ctx('booking_confirmed'), opts);
    expect(email.subject).toContain('14:30'); // 17:30Z = 14:30 em São Paulo
    expect(email.html).toContain('https://app.test/r/abc.def');
    expect(email.html).toContain('Studio &lt;Exemplo&gt;'); // HTML escapado
    expect(email.text).toContain('Olá, Mariana!');
    expect(email.attachment?.content).toContain('DTSTART:20301118T173000Z');
  });

  it('cancelamento convida a reagendar e envia .ics de cancelamento', () => {
    const email = renderEmail(ctx('booking_cancelled', { status: 'cancelled' }), opts);
    expect(email.subject.startsWith('Cancelado')).toBe(true);
    expect(email.html).toContain('https://app.test/studio');
    expect(email.attachment?.content).toContain('METHOD:CANCEL');
  });
});

describe('WhatsApp', () => {
  it('usa template de utilidade com parâmetros', () => {
    const msg = renderWhatsApp(ctx('reminder_24h'), opts)!;
    expect(msg.template).toBe('lembrete_agendamento');
    expect(msg.params[0]).toBe('Mariana');
    expect(msg.params[3]).toContain('14:30');
  });
});

describe('descartes no momento do envio', () => {
  it('lembrete de reserva reagendada é descartado', () => {
    expect(shouldSkip(ctx('reminder_24h', {}, { starts_at: '2030-11-17T17:30:00Z' }))).toBe('rescheduled');
  });
  it('lembrete de reserva cancelada é descartado', () => {
    expect(shouldSkip(ctx('reminder_2h', { status: 'cancelled' }))).toBe('booking_not_confirmed');
  });
  it('lembrete válido segue', () => {
    expect(shouldSkip(ctx('reminder_2h', {}, { starts_at: booking.starts_at }))).toBeNull();
  });
});
