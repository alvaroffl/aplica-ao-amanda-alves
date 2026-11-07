/// <reference types="vitest/config" />
import path from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Agendaê — Agendamento online',
        short_name: 'Agendaê',
        description: 'Agende serviços em poucos toques e gerencie sua agenda.',
        lang: 'pt-BR',
        start_url: '/painel',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#5b3ee8',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        // dados da API nunca vêm do cache (agenda precisa estar sempre atual)
        navigateFallbackDenylist: [/^\/rest\//, /^\/auth\//, /^\/functions\//],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: {
    port: 5173,
    strictPort: true,
    // Com VITE_SUPABASE_URL=/supabase, o navegador fala só com o Vite, que
    // repassa ao Supabase local (abre no celular pela rede e evita CORS).
    // O `vite preview` herda este proxy.
    proxy: {
      '/supabase': {
        target: process.env.SUPABASE_PROXY_TARGET ?? 'http://127.0.0.1:54321',
        changeOrigin: true,
        ws: true,
        rewrite: (p) => p.replace(/^\/supabase/, ''),
      },
    },
    // DEV_ALLOW_ANY_HOST=1 aceita qualquer cabeçalho Host (túnel ou pré-visualização
    // remota). Desliga a proteção contra DNS rebinding: use só em rede confiável.
    ...(process.env.DEV_ALLOW_ANY_HOST === '1' ? { allowedHosts: true as const } : {}),
  },
  preview: { port: 4173, strictPort: true },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 600,
    sourcemap: true,
    rollupOptions: {
      output: {
        // Agrupa dependências por domínio. React, React DOM e scheduler ficam
        // juntos (separá-los quebra a ordem de inicialização em produção).
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]@fullcalendar[\\/]/.test(id)) return 'calendar';
          if (/[\\/]@supabase[\\/]/.test(id)) return 'supabase';
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/.test(id))
            return 'react';
          if (/[\\/]node_modules[\\/](zod|react-hook-form|@hookform[\\/]resolvers)[\\/]/.test(id))
            return 'forms';
          if (
            /[\\/]node_modules[\\/](i18next|react-i18next|i18next-browser-languagedetector)[\\/]/.test(
              id,
            )
          )
            return 'i18n';
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
});
