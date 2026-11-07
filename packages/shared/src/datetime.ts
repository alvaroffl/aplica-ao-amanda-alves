import { addDays, format, parseISO } from 'date-fns';
import { formatInTimeZone, fromZonedTime, getTimezoneOffset } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';

/**
 * Regra do projeto: todo horário é armazenado em UTC (timestamptz) e exibido
 * no fuso da UNIDADE (atendimento presencial). Todas as telas e mensagens
 * usam estas funções — um único formatador evita divergência entre tela,
 * e-mail, WhatsApp e .ics.
 */

export const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

export function toDate(value: Date | string): Date {
  return typeof value === 'string' ? parseISO(value) : value;
}

export function formatInZone(value: Date | string, timeZone: string, pattern: string): string {
  return formatInTimeZone(toDate(value), timeZone, pattern, { locale: ptBR });
}

/** "segunda-feira, 16 de novembro" */
export function formatLongDate(value: Date | string, timeZone: string): string {
  return formatInZone(value, timeZone, "EEEE, d 'de' MMMM");
}

/** "14:30" */
export function formatTime(value: Date | string, timeZone: string): string {
  return formatInZone(value, timeZone, 'HH:mm');
}

/** "16/11/2026 às 14:30" */
export function formatDateTime(value: Date | string, timeZone: string): string {
  return formatInZone(value, timeZone, "dd/MM/yyyy 'às' HH:mm");
}

/** Data local (yyyy-MM-dd) de um instante no fuso informado. */
export function localDateKey(value: Date | string, timeZone: string): string {
  return formatInTimeZone(toDate(value), timeZone, 'yyyy-MM-dd');
}

/** Hoje (yyyy-MM-dd) no fuso informado. */
export function todayKey(timeZone: string, now: Date = new Date()): string {
  return localDateKey(now, timeZone);
}

export function addDaysToKey(key: string, days: number): string {
  return format(addDays(parseISO(`${key}T12:00:00`), days), 'yyyy-MM-dd');
}

/** Converte data + hora LOCAIS de um fuso em instante UTC. */
export function zonedToUtc(dateKey: string, time: string, timeZone: string): Date {
  return fromZonedTime(`${dateKey}T${time.length === 5 ? `${time}:00` : time}`, timeZone);
}

/** Nome legível do fuso: "Horário Padrão de Brasília". */
export function timeZoneLabel(timeZone: string, locale = 'pt-BR', at: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: 'long' }).formatToParts(
      at,
    );
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? timeZone;
  } catch {
    return timeZone;
  }
}

/** true se os dois fusos têm o mesmo deslocamento UTC no instante dado. */
export function sameOffset(a: string, b: string, at: Date = new Date()): boolean {
  return getTimezoneOffset(a, at) === getTimezoneOffset(b, at);
}

export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

export type DayPeriod = 'morning' | 'afternoon' | 'evening';

export function dayPeriod(value: Date | string, timeZone: string): DayPeriod {
  const hour = Number(formatInTimeZone(toDate(value), timeZone, 'H'));
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

export function groupByPeriod<T extends { starts_at: string }>(
  slots: T[],
  timeZone: string,
): Record<DayPeriod, T[]> {
  const groups: Record<DayPeriod, T[]> = { morning: [], afternoon: [], evening: [] };
  for (const slot of slots) groups[dayPeriod(slot.starts_at, timeZone)].push(slot);
  return groups;
}

export const WEEKDAYS_PT = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
] as const;

/** Duração amigável: 90 → "1h30", 45 → "45 min" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}
