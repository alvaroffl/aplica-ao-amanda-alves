import { expect, test } from '@playwright/test';
import { expectAccessible } from './helpers';

test('equipe entra no painel e vê a agenda e os relatórios', async ({ page }) => {
  await page.goto('/entrar');
  await page.getByLabel('E-mail').fill('demo@agendae.dev');
  await page.getByLabel('Senha').fill('demo12345');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();

  await expect(page.locator('.fc-event').first()).toBeVisible();
  await page.getByRole('radio', { name: 'Lista' }).click();
  await expect(page.locator('.fc-list')).toBeVisible();

  await page.getByRole('link', { name: 'Relatórios' }).click();
  await expect(page.getByText('Taxa de faltas')).toBeVisible();
  await expectAccessible(page);

  await page.getByRole('link', { name: 'Clientes' }).click();
  await page.getByRole('searchbox', { name: /Buscar/ }).fill('Mariana');
  await page.getByRole('link', { name: /Mariana Costa/ }).click();
  await expect(page.getByRole('heading', { name: 'Mariana Costa' })).toBeVisible();
});

test('rota do painel exige login', async ({ page }) => {
  await page.goto('/painel/configuracoes');
  await expect(page).toHaveURL(/\/entrar/);
});
