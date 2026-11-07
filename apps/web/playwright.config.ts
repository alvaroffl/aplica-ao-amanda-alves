import { defineConfig, devices } from '@playwright/test';

/**
 * E2E contra o Supabase local (`pnpm db:start` + `pnpm functions:serve`).
 * Por padrão usa o Vite (dev). Com E2E_PREVIEW=1 roda contra o BUILD de
 * produção (`vite preview`) — é assim no CI, para pegar erros de bundle.
 */
const preview = Boolean(process.env.E2E_PREVIEW);
const baseURL =
  process.env.E2E_BASE_URL ?? (preview ? 'http://localhost:4173' : 'http://localhost:5173');
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'off',
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /booking|payment/ },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, testMatch: /panel|concurrency/ },
  ],
  webServer: {
    command: preview ? 'pnpm preview' : 'pnpm dev',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
