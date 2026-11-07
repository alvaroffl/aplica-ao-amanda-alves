import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

/**
 * O FullCalendar roda em timeZone "UTC" e recebe o "horário de parede" do
 * negócio codificado como UTC. Assim a agenda mostra sempre o horário do
 * negócio, independentemente do fuso do computador de quem está usando, sem
 * precisar de plugin de fuso.
 */
export function toWall(value: string | Date, timeZone: string): string {
  return `${formatInTimeZone(value, timeZone, "yyyy-MM-dd'T'HH:mm:ss")}Z`;
}

export function fromWall(date: Date, timeZone: string): Date {
  return fromZonedTime(date.toISOString().slice(0, 19), timeZone);
}
