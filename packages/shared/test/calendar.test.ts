import { describe, expect, it } from 'vitest';
import { buildIcs, googleCalendarUrl, whatsappShareUrl } from '../src/calendar.ts';

const event = {
  uid: 'abc@agendae',
  start: '2026-11-16T12:00:00Z',
  end: '2026-11-16T13:00:00Z',
  title: 'Corte; feminino, com Carla',
  description: 'Linha 1\nLinha 2',
  location: 'Rua das Flores, 123',
};

describe('ICS', () => {
  const ics = buildIcs(event);
  it('usa CRLF e horários em UTC', () => {
    expect(ics).toContain('\r\n');
    expect(ics).toContain('DTSTART:20261116T120000Z');
    expect(ics).toContain('DTEND:20261116T130000Z');
  });
  it('escapa caracteres especiais', () => {
    expect(ics).toContain('SUMMARY:Corte\\; feminino\\, com Carla');
    expect(ics).toContain('DESCRIPTION:Linha 1\\nLinha 2');
  });
  it('dobra linhas longas', () => {
    const long = buildIcs({ ...event, description: 'x'.repeat(200) });
    for (const line of long.split('\r\n')) expect(line.length).toBeLessThanOrEqual(75);
  });
  it('gera cancelamento', () => {
    expect(buildIcs({ ...event, status: 'CANCELLED' })).toContain('METHOD:CANCEL');
  });
});

describe('links', () => {
  it('Google Calendar', () => {
    const url = new URL(googleCalendarUrl(event));
    expect(url.hostname).toBe('calendar.google.com');
    expect(url.searchParams.get('dates')).toBe('20261116T120000Z/20261116T130000Z');
  });
  it('WhatsApp', () => {
    expect(whatsappShareUrl('Olá mundo', '+5511987654321')).toBe('https://wa.me/5511987654321?text=Ol%C3%A1%20mundo');
  });
});
