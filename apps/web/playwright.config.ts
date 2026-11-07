import { defineConfig, devices } from '@playwright/test';

/**
 * E2E contra o Supabase local (`pnpm db:start` + `pnpm functions:serve`)
 * e o Vite. Em CI o workflow sobe tudo antes.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'off',
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /booking|payment/ },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, testMatch: /panel|concurrency/ },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
