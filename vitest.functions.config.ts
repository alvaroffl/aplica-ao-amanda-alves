import { defineConfig } from 'vitest/config';

// Testes unitários da lógica pura das Edge Functions (rodam no Node).
export default defineConfig({
  test: {
    include: ['supabase/functions/_tests/**/*.test.ts'],
    environment: 'node',
  },
});
