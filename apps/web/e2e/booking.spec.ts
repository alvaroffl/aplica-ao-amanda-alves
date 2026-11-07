import { expect, test } from '@playwright/test';
import { expectAccessible, fillDetails, pickFirstSlot, SLUG, uniqueEmail } from './helpers';

test.describe('reserva pública (celular)', () => {
  test('avaliação gratuita: agenda sem cadastro nem pagamento e cancela pelo link', async ({
    page,
  }) => {
    await page.goto(`/${SLUG}`);
    await expect(page.getByRole('heading', { name: 'Escolha o serviço' })).toBeVisible();
    // dados fictícios sinalizados e canal de apoio no WhatsApp
    await expect(page.getByText(/Valores, durações e sinais ilustrativos/)).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Falar com a Amanda|Chamar no WhatsApp/ }),
    ).toHaveAttribute('href', /wa\.me\/5532988829364/);
    await expectAccessible(page);

    // 1. serviço (uma profissional → sem o passo de escolha)
    await page.getByRole('button', { name: /Avaliação gratuita/ }).click();
    // 2. data e horário
    await expect(page.getByText('Passo 2 de 3')).toBeVisible();
    await expectAccessible(page);
    const time = await pickFirstSlot(page);
    // 3. dados
    await expect(page.getByText('Passo 3 de 3')).toBeVisible();
    await expect(page.getByText(/A avaliação é gratuita e não exige pagamento/)).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar agendamento' }).click();
    await expect(page.getByText('É preciso concordar para continuar.')).toBeVisible();
    await fillDetails(page, 'Cliente E2E', uniqueEmail('reserva'));
    await expectAccessible(page);
    await page.getByRole('button', { name: 'Confirmar agendamento' }).click();

    // confirmação no link seguro
    await expect(page).toHaveURL(/\/r\/[0-9a-f]{32}\.[0-9a-f]{32}\?novo=1/);
    await expect(page.getByRole('heading', { name: 'Agendamento confirmado!' })).toBeVisible();
    await expect(page.getByText(`às ${time}`).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Google Agenda/ })).toHaveAttribute(
      'href',
      /calendar\.google\.com/,
    );
    await expectAccessible(page);

    // cancelamento pelo link
    await page.getByRole('button', { name: 'Cancelar agendamento' }).click();
    await page.getByRole('button', { name: 'Sim, cancelar' }).click();
    await expect(page.getByRole('heading', { name: 'Agendamento cancelado' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Agendar novo horário' })).toBeVisible();
  });

  test('voltar do navegador preserva os passos (estado na URL)', async ({ page }) => {
    await page.goto(`/${SLUG}`);
    await page.getByRole('button', { name: /^Micro Sobrancelha/ }).click(); // uma profissional
    await expect(page.getByText('Passo 2 de 3')).toBeVisible();
    await page.goBack();
    await expect(page.getByRole('heading', { name: 'Escolha o serviço' })).toBeVisible();
  });

  test('link adulterado mostra erro amigável', async ({ page }) => {
    await page.goto('/r/00000000000000000000000000000000.00000000000000000000000000000000');
    await expect(page.getByRole('heading', { name: 'Link inválido' })).toBeVisible();
  });
});
