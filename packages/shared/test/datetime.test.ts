import { describe, expect, it } from 'vitest';
import {
  addDaysToKey,
  formatDuration,
  formatTime,
  groupByPeriod,
  localDateKey,
  sameOffset,
  zonedToUtc,
} from '../src/datetime.ts';

describe('fusos horários', () => {
  it('converte hora local da unidade para UTC', () => {
    expect(zonedToUtc('2026-11-16', '09:00', 'America/Sao_Paulo').toISOString()).toBe(
      '2026-11-16T12:00:00.000Z',
    );
    // Lisboa: inverno UTC+0, verão UTC+1
    expect(zonedToUtc('2026-01-15', '09:00', 'Europe/Lisbon').toISOString()).toBe(
      '2026-01-15T09:00:00.000Z',
    );
    expect(zonedToUtc('2026-07-15', '09:00', 'Europe/Lisbon').toISOString()).toBe(
      '2026-07-15T08:00:00.000Z',
    );
  });

  it('exibe sempre no fuso informado, independente do fuso do processo', () => {
    expect(formatTime('2026-11-16T12:00:00Z', 'America/Sao_Paulo')).toBe('09:00');
    expect(formatTime('2026-11-16T12:00:00Z', 'Asia/Tokyo')).toBe('21:00');
  });

  it('data local pode diferir da data UTC', () => {
    expect(localDateKey('2026-11-17T01:30:00Z', 'America/Sao_Paulo')).toBe('2026-11-16');
  });

  it('compara deslocamentos', () => {
    const at = new Date('2026-11-16T12:00:00Z');
    expect(sameOffset('America/Sao_Paulo', 'America/Bahia', at)).toBe(true);
    expect(sameOffset('America/Sao_Paulo', 'America/Manaus', at)).toBe(false);
  });

  it('soma dias em chaves de data', () => {
    expect(addDaysToKey('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('agrupa horários por período do dia (no fuso da unidade)', () => {
    const slots = [
      { starts_at: '2026-11-16T12:00:00Z' }, // 09:00
      { starts_at: '2026-11-16T17:00:00Z' }, // 14:00
      { starts_at: '2026-11-16T21:30:00Z' }, // 18:30
    ];
    const groups = groupByPeriod(slots, 'America/Sao_Paulo');
    expect(groups.morning).toHaveLength(1);
    expect(groups.afternoon).toHaveLength(1);
    expect(groups.evening).toHaveLength(1);
  });

  it('formata duração', () => {
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(90)).toBe('1h30');
  });
});
