import { expect, test } from '@playwright/test';
import { fillDetails, pickFirstSlot, SLUG, uniqueEmail } from './helpers';

test('serviço com sinal: pré-reserva, Pix e confirmação após o pagamento', async ({ page }) => {
  await page.goto(`/${SLUG}`);
  await page.getByRole('button', { name: /Coloração/ }).click(); // sinal fixo de R$ 50
  await pickFirstSlot(page);
  await fillDetails(page, 'Cliente Pix', uniqueEmail('pix'));
  await page.getByRole('button', { name: /Continuar para pagamento/ }).click();

  await expect(page.getByRole('heading', { name: 'Falta só o sinal' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'QR Code do Pix' })).toBeVisible();
  await expect(page.getByText(/Reserva expira em \d\d:\d\d/)).toBeVisible();

  // provedor "fake" de desenvolvimento simula a aprovação (webhook)
  await page.getByRole('button', { name: /Simular pagamento aprovado/ }).click();
  await expect(page.getByRole('heading', { name: 'Agendamento confirmado!' })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText('Sinal pago')).toBeVisible();
});
