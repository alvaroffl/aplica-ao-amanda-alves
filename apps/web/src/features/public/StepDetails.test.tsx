import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { TurnstileHandle } from '@/components/common/Turnstile';
import { StepDetails } from './StepDetails';

function setup(depositCents = 0) {
  const onSubmit = vi.fn();
  render(
    <StepDetails
      depositCents={depositCents}
      priceCents={depositCents * 3}
      currency="BRL"
      policy={{
        reschedule_min_hours: 48,
        refund_min_hours: 24,
        refund_percent: 100,
        client_can_reschedule: true,
        client_can_cancel: true,
        notes: null,
      }}
      maxInstallments={3}
      submitting={false}
      onSubmit={onSubmit}
      captchaRef={createRef<TurnstileHandle>()}
    />,
  );
  return { onSubmit, user: userEvent.setup() };
}

describe('StepDetails (dados do cliente)', () => {
  it('valida campos obrigatórios e o consentimento LGPD com mensagens em pt-BR', async () => {
    const { onSubmit, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Confirmar agendamento' }));
    expect(await screen.findByText('Informe seu nome completo.')).toBeInTheDocument();
    expect(screen.getByText('Informe um e-mail válido.')).toBeInTheDocument();
    expect(screen.getByText('Informe seu WhatsApp.')).toBeInTheDocument();
    expect(screen.getByText('É preciso concordar para continuar.')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome completo')).toHaveAttribute('aria-invalid', 'true');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('normaliza e-mail e telefone antes de enviar', async () => {
    const { onSubmit, user } = setup();
    await user.type(screen.getByLabelText('Nome completo'), 'Maria Souza');
    await user.type(screen.getByLabelText('E-mail'), 'Maria@Exemplo.COM');
    await user.type(screen.getByLabelText('WhatsApp'), '(11) 98765-4321');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Confirmar agendamento' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const arg = onSubmit.mock.calls[0]![0];
    expect(arg.client).toMatchObject({
      name: 'Maria Souza',
      email: 'maria@exemplo.com',
      phone: '+5511987654321',
      consent: true,
    });
    expect(arg.paymentMethod).toBe('pix');
  });

  it('com sinal, mostra o valor e permite escolher cartão', async () => {
    const { user } = setup(2700);
    expect(screen.getByText(/sinal de R\$\s27,00/)).toBeInTheDocument();
    await user.click(screen.getByLabelText('Cartão'));
    expect(screen.getByLabelText('Cartão')).toBeChecked();
    expect(screen.getByRole('button', { name: /Continuar para pagamento/ })).toBeInTheDocument();
  });
});
