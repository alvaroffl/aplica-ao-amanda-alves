import { expect, test } from '@playwright/test';
import { expectAccessible } from './helpers';

test('equipe entra no painel e vê a agenda e os relatórios', async ({ page }) => {
  await page.goto('/entrar');
  await page.getByLabel('E-mail').fill('amanda@demo.test');
  await page.getByLabel('Senha').fill('demo12345');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();

  await expect(page.locator('.fc-event').first()).toBeVisible();
  await page.getByRole('radio', { name: 'Lista' }).click();
  await expect(page.locator('.fc-list')).toBeVisible();

  await page.getByRole('link', { name: 'Relatórios' }).click();
  await expect(page.getByText('Taxa de faltas')).toBeVisible();
  await expectAccessible(page);

  await page.getByRole('link', { name: 'Clientes' }).click();
  await page.getByRole('searchbox', { name: /Buscar/ }).fill('Juliana');
  await page.getByRole('link', { name: /Juliana Ferreira/ }).click();
  await expect(page.getByRole('heading', { name: /Juliana Ferreira/ })).toBeVisible();
});

test('admin vê aviso de demonstração, pagamentos e pede estorno', async ({ page }) => {
  await page.goto('/entrar');
  await page.getByLabel('E-mail').fill('amanda@demo.test');
  await page.getByLabel('Senha').fill('demo12345');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();

  await expect(page.getByRole('note').filter({ hasText: 'Dados de demonstração' })).toBeVisible();

  await page.getByRole('link', { name: 'Pagamentos' }).click();
  await expect(page.getByRole('heading', { name: 'Pagamentos', level: 1 })).toBeVisible();
  await expect(page.getByText('Teste').first()).toBeVisible();
  await expectAccessible(page);

  await page.getByRole('button', { name: 'Estornar' }).first().click();
  await expect(page.getByRole('dialog', { name: 'Estornar pagamento' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirmar estorno' }).click();
  await expect(page.getByText('Estorno solicitado.', { exact: false })).toBeVisible();

  await page.getByRole('link', { name: 'Configurações' }).click();
  await expect(page.getByText('Política de remarcação e cancelamento')).toBeVisible();
  await expect(page.getByLabel('Remarcação até (h antes)')).toHaveValue('48');
  await expect(page.getByRole('button', { name: 'Remover dados de demonstração' })).toBeVisible();
  await expectAccessible(page);
});

test('rota do painel exige login', async ({ page }) => {
  await page.goto('/painel/configuracoes');
  await expect(page).toHaveURL(/\/entrar/);
});
