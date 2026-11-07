import { expect, test } from '@playwright/test';
import { expectAccessible, fillDetails, pickFirstSlot, SLUG, uniqueEmail } from './helpers';

test('Pix: pré-reserva, aviso de teste, QR Code e confirmação automática', async ({ page }) => {
  await page.goto(`/${SLUG}`);
  await page.getByRole('button', { name: /Hydra Gloss/ }).click(); // sinal de 50%
  await pickFirstSlot(page);
  await fillDetails(page, 'Cliente Pix', uniqueEmail('pix'));
  await expect(page.getByText(/Modo de teste:/)).toBeVisible();
  await expect(page.getByText(/Você pode remarcar pelo link até 48h antes/)).toBeVisible();
  await page.getByRole('button', { name: /Continuar para pagamento \(R\$\s?125,00\)/ }).click();

  await expect(page.getByRole('heading', { name: 'Falta só o sinal' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'QR Code do Pix' })).toBeVisible();
  await expect(page.getByText(/Reserva expira em \d\d:\d\d/)).toBeVisible();
  await expect(page.getByText(/Modo de teste:/)).toBeVisible();
  await expectAccessible(page);

  // provedor "fake" de desenvolvimento simula a aprovação (webhook)
  await page.getByRole('button', { name: /Simular pagamento aprovado/ }).click();
  await expect(page.getByRole('heading', { name: 'Agendamento confirmado!' })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText('Sinal pago')).toBeVisible();
});

test('cartão: checkout do gateway e confirmação após o pagamento', async ({ page }) => {
  await page.goto(`/${SLUG}`);
  await page.getByRole('button', { name: /Protocolo Hidratação Profunda/ }).click();
  await pickFirstSlot(page);
  await fillDetails(page, 'Cliente Cartão', uniqueEmail('cartao'));
  await page.getByText('Cartão', { exact: true }).click();
  await expect(page.getByText(/Crédito em até 3x ou débito/)).toBeVisible();
  await page.getByRole('button', { name: /Continuar para pagamento/ }).click();

  await expect(page.getByRole('heading', { name: 'Falta só o sinal' })).toBeVisible();
  // provedor de teste: sem página do gateway, usa a simulação
  await page.getByRole('button', { name: /Simular pagamento aprovado/ }).click();
  await expect(page.getByRole('heading', { name: 'Agendamento confirmado!' })).toBeVisible({
    timeout: 20_000,
  });
});
