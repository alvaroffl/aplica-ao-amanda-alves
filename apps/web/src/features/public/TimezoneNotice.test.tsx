import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TimezoneNotice } from './TimezoneNotice';

describe('TimezoneNotice', () => {
  it('mesmo fuso: apenas informa o fuso', () => {
    render(<TimezoneNotice timeZone="America/Sao_Paulo" unitName="Centro" />);
    expect(screen.getByText(/Horários no/)).toBeInTheDocument();
  });
  it('fuso diferente do aparelho: alerta explícito', () => {
    render(<TimezoneNotice timeZone="Asia/Tokyo" unitName="Tóquio" />);
    expect(screen.getByText(/Os horários estão no fuso de Tóquio/)).toBeInTheDocument();
  });
});
