import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SlotPicker } from './SlotPicker';

const slots = [
  { starts_at: '2026-11-16T12:00:00Z' }, // 09:00 em São Paulo
  { starts_at: '2026-11-16T12:30:00Z' }, // 09:30
  { starts_at: '2026-11-16T17:00:00Z' }, // 14:00
  { starts_at: '2026-11-16T21:30:00Z' }, // 18:30
];

describe('SlotPicker', () => {
  it('mostra horários no fuso da unidade, agrupados por período', () => {
    render(
      <SlotPicker slots={slots} timeZone="America/Sao_Paulo" selected={null} onSelect={() => {}} />,
    );
    expect(screen.getByRole('heading', { name: 'Manhã' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tarde' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Noite' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '09:00' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '18:30' })).toBeInTheDocument();
  });

  it('usa o fuso informado, não o do navegador', () => {
    render(
      <SlotPicker
        slots={slots.slice(0, 1)}
        timeZone="Europe/Lisbon"
        selected={null}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: '12:00' })).toBeInTheDocument();
  });

  it('marca o selecionado e dispara onSelect', async () => {
    const onSelect = vi.fn();
    render(
      <SlotPicker
        slots={slots}
        timeZone="America/Sao_Paulo"
        selected={slots[2]!.starts_at}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByRole('button', { name: '14:00' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: '09:30' }));
    expect(onSelect).toHaveBeenCalledWith(slots[1]);
  });
});
