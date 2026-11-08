import { expect, test } from '@playwright/test';
import { expectAccessible } from './helpers';

test('página inicial da clínica: marca, procedimentos e avaliação gratuita', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Amanda Alves | Estética Avançada');
  await expect(page.getByRole('img', { name: 'Amanda Alves', exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Beleza elevada à sua forma mais autêntica.' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Micro Sobrancelha', level: 3 })).toBeVisible();
  await expectAccessible(page);

  await page.getByRole('link', { name: 'Agendar Avaliação Gratuita' }).first().click();
  await expect(page).toHaveURL(/\/amanda-alves\?servico=avaliacao/);
  await expect(page.getByText('Passo 2 de 4')).toBeVisible();
  await expect(page.getByText('Avaliação gratuita').first()).toBeVisible();
});
