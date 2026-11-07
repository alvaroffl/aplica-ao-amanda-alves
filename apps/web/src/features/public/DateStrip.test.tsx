import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DateStrip } from './DateStrip';

describe('DateStrip', () => {
  it('desabilita dias sem horário e seleciona dias disponíveis', async () => {
    const onSelect = vi.fn();
    render(
      <DateStrip
        start="2026-11-16"
        days={7}
        selected="2026-11-17"
        available={new Set(['2026-11-17', '2026-11-18'])}
        timeZone="America/Sao_Paulo"
        minDate="2026-11-16"
        onSelect={onSelect}
        onPage={() => {}}
      />,
    );
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(7);
    expect(options[0]).toBeDisabled();
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
    expect(options[1]).toHaveAccessibleName(/terça-feira, 17 de novembro/);
    await userEvent.click(options[2]!);
    expect(onSelect).toHaveBeenCalledWith('2026-11-18');
    expect(screen.getByRole('button', { name: 'Datas anteriores' })).toBeDisabled();
  });
});
