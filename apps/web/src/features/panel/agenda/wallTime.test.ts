import { describe, expect, it } from 'vitest';
import { fromWall, toWall } from './wallTime';

describe('horário de parede da agenda', () => {
  it('codifica o horário do negócio como UTC e volta sem perda', () => {
    const real = '2026-11-16T12:00:00.000Z'; // 09:00 em São Paulo
    const wall = toWall(real, 'America/Sao_Paulo');
    expect(wall).toBe('2026-11-16T09:00:00Z');
    expect(fromWall(new Date(wall), 'America/Sao_Paulo').toISOString()).toBe(real);
  });
  it('funciona com horário de verão (Lisboa)', () => {
    const real = '2026-07-15T08:00:00.000Z'; // 09:00 WEST
    const wall = toWall(real, 'Europe/Lisbon');
    expect(wall).toBe('2026-07-15T09:00:00Z');
    expect(fromWall(new Date(wall), 'Europe/Lisbon').toISOString()).toBe(real);
  });
});
