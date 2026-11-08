import { expect, test, type Page } from '@playwright/test';
import { SLUG } from './helpers';

/** Nenhuma tela pode ficar mais larga que o celular (o navegador reduziria o zoom). */
async function expectNoHorizontalOverflow(page: Page, label: string) {
  // expressão avaliada no navegador (o tsconfig dos testes não inclui o DOM)
  const [scroll, viewport] = (await page.evaluate(
    '[document.documentElement.scrollWidth, document.documentElement.clientWidth]',
  )) as [number, number];
  expect(scroll, `${label}: largura ${scroll}px em tela de ${viewport}px`).toBeLessThanOrEqual(
    viewport,
  );
}

test.use({ viewport: { width: 360, height: 780 } });

test('celular de 360 px: páginas da cliente sem rolagem horizontal', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('img', { name: 'Amanda Alves' })).toBeVisible();
  await expectNoHorizontalOverflow(page, 'início');

  await page.goto(`/${SLUG}`);
  await page.getByRole('button', { name: /Hydra Gloss/ }).click();
  await expect(page.getByRole('option', { disabled: false }).first()).toBeVisible();
  await expectNoHorizontalOverflow(page, 'escolha de horário');
});

test('celular de 360 px: painel sem rolagem horizontal', async ({ page }) => {
  await page.goto('/entrar');
  await page.getByLabel('E-mail').fill('amanda@demo.test');
  await page.getByLabel('Senha').fill('demo12345');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.locator('.fc-event').first()).toBeVisible();
  await expectNoHorizontalOverflow(page, 'agenda');

  for (const path of ['disponibilidade', 'relatorios', 'pagamentos', 'configuracoes', 'unidades']) {
    await page.goto(`/painel/${path}`);
    await expect(page.locator('main h1')).toBeVisible();
    await expectNoHorizontalOverflow(page, path);
  }
});
