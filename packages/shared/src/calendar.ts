/**
 * Geração de .ics (RFC 5545) e links "adicionar ao Google Calendar".
 * Horários sempre em UTC ("Z"): o aplicativo de calendário converte para o
 * fuso do aparelho, sem ambiguidade.
 */

export interface CalendarEvent {
  uid: string;
  start: Date | string;
  end: Date | string;
  title: string;
  description?: string;
  location?: string;
  url?: string;
  status?: 'CONFIRMED' | 'CANCELLED';
  sequence?: number;
}

function toUtcStamp(value: Date | string): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

/** Dobra linhas em 75 caracteres (RFC 5545 §3.1). */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let rest = line;
  chunks.push(rest.slice(0, 75));
  rest = rest.slice(75);
  while (rest.length > 0) {
    chunks.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  return chunks.join('\r\n');
}

export function buildIcs(event: CalendarEvent, productName = 'Agendae'): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${productName}//Agendamento//PT-BR`,
    'CALSCALE:GREGORIAN',
    `METHOD:${event.status === 'CANCELLED' ? 'CANCEL' : 'PUBLISH'}`,
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    `DTSTART:${toUtcStamp(event.start)}`,
    `DTEND:${toUtcStamp(event.end)}`,
    `SUMMARY:${escapeText(event.title)}`,
    event.description ? `DESCRIPTION:${escapeText(event.description)}` : null,
    event.location ? `LOCATION:${escapeText(event.location)}` : null,
    event.url ? `URL:${event.url}` : null,
    `STATUS:${event.status ?? 'CONFIRMED'}`,
    `SEQUENCE:${event.sequence ?? 0}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Lembrete',
    'TRIGGER:-PT2H',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter((l): l is string => l !== null);
  return lines.map(fold).join('\r\n') + '\r\n';
}

export function googleCalendarUrl(event: Omit<CalendarEvent, 'uid'>): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${toUtcStamp(event.start)}/${toUtcStamp(event.end)}`,
  });
  if (event.description) params.set('details', event.description);
  if (event.location) params.set('location', event.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function whatsappShareUrl(text: string, phoneE164?: string | null): string {
  const base = phoneE164 ? `https://wa.me/${phoneE164.replace(/\D/g, '')}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(text)}`;
}
