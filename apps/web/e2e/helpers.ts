import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

export const SLUG = 'amanda-alves';
export const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? 'http://127.0.0.1:54321';
export const ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ?? 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

/** Auditoria WCAG 2.1 AA (axe-core). */
export async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const summary = results.violations.map((v) => `${v.id}: ${v.nodes.length} nó(s) — ${v.help}`);
  expect(summary, summary.join('\n')).toEqual([]);
}

export function uniqueEmail(prefix: string) {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1e4)}@e2e.dev`;
}

export async function fillDetails(page: Page, name: string, email: string) {
  await page.getByLabel('Nome completo').fill(name);
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('WhatsApp').fill('(11) 98765-4321');
  await page.getByRole('checkbox', { name: /Concordo/ }).check();
}

/** Escolhe o primeiro dia disponível a partir de amanhã e o primeiro horário. */
export async function pickFirstSlot(page: Page) {
  const days = page.getByRole('option', { disabled: false });
  await expect(days.first()).toBeVisible();
  const count = await days.count();
  const day = days.nth(count > 1 ? 1 : 0);
  await day.click();
  await expect(day).toHaveAttribute('aria-selected', 'true');
  const slot = page.locator('button[aria-pressed]').first();
  await expect(slot).toBeVisible();
  const time = (await slot.textContent())!.trim();
  await page.getByRole('button', { name: time, exact: true }).click();
  await expect(page.getByText(/Passo \d de \d/)).toContainText(/Passo (3 de 4|4 de 5)/);
  return time;
}
