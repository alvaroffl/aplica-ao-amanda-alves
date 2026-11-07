import { expect, test } from '@playwright/test';
import { expectAccessible, fillDetails, pickFirstSlot, SLUG, uniqueEmail } from './helpers';

test.describe('reserva pública (celular)', () => {
  test('cliente agenda em 4 passos, sem cadastro, e cancela pelo link seguro', async ({ page }) => {
    await page.goto(`/${SLUG}`);
    await expect(page.getByRole('heading', { name: 'Escolha o serviço' })).toBeVisible();
    await expectAccessible(page);

    // 1. serviço (Escova: duas profissionais → passo de profissional aparece)
    await page.getByRole('button', { name: /Escova/ }).click();
    // 2. profissional
    await expect(page.getByText('Passo 2 de 4')).toBeVisible();
    await page.getByRole('button', { name: /Qualquer profissional/ }).click();
    // 3. data e horário
    await expect(page.getByText('Passo 3 de 4')).toBeVisible();
    await expectAccessible(page);
    const time = await pickFirstSlot(page);
    // 4. dados
    await expect(page.getByText('Passo 4 de 4')).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar agendamento' }).click();
    await expect(page.getByText('É preciso concordar para continuar.')).toBeVisible();
    await fillDetails(page, 'Cliente E2E', uniqueEmail('reserva'));
    await expectAccessible(page);
    await page.getByRole('button', { name: 'Confirmar agendamento' }).click();

    // confirmação no link seguro
    await expect(page).toHaveURL(/\/r\/[0-9a-f]{32}\.[0-9a-f]{32}\?novo=1/);
    await expect(page.getByRole('heading', { name: 'Agendamento confirmado!' })).toBeVisible();
    await expect(page.getByText(`às ${time}`).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Google Agenda/ })).toHaveAttribute('href', /calendar\.google\.com/);
    await expectAccessible(page);

    // cancelamento pelo link
    await page.getByRole('button', { name: 'Cancelar agendamento' }).click();
    await page.getByRole('button', { name: 'Sim, cancelar' }).click();
    await expect(page.getByRole('heading', { name: 'Agendamento cancelado' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Agendar novo horário' })).toBeVisible();
  });

  test('voltar do navegador preserva os passos (estado na URL)', async ({ page }) => {
    await page.goto(`/${SLUG}`);
    await page.getByRole('button', { name: /Manicure/ }).click(); // um profissional → pula passo 2
    await expect(page.getByText('Passo 2 de 3')).toBeVisible();
    await page.goBack();
    await expect(page.getByRole('heading', { name: 'Escolha o serviço' })).toBeVisible();
  });

  test('link adulterado mostra erro amigável', async ({ page }) => {
    await page.goto('/r/00000000000000000000000000000000.00000000000000000000000000000000');
    await expect(page.getByRole('heading', { name: 'Link inválido' })).toBeVisible();
  });
});
