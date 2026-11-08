/// <reference types="vitest/config" />
import path from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Endereço público do app nas meta tags de compartilhamento (Open Graph):
 * substitui %SITE_URL% no index.html por VITE_SITE_URL (ex.: https://agendar.amandaalvespmu.com.br).
 */
function siteUrl(): Plugin {
  let url = '';
  return {
    name: 'site-url',
    configResolved(config) {
      url = String(config.env.VITE_SITE_URL ?? '').replace(/\/$/, '');
    },
    transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', url),
  };
}

export default defineConfig({
  plugins: [
    siteUrl(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'favicon.png',
        'apple-touch-icon.png',
        'brand/logo-amanda-alves.webp',
        'brand/monograma.webp',
      ],
      manifest: {
        name: 'Amanda Alves | Estética Avançada',
        short_name: 'Amanda Alves',
        description:
          'Agende micropigmentação e estética avançada com Amanda Alves: avaliação gratuita e sinal online.',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f9f7f2',
        theme_color: '#f9f7f2',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
        // fotos e texturas não entram na instalação (o navegador escolhe AVIF ou
        // WebP e o tamanho certo); ficam em cache depois de vistas
        globIgnores: ['brand/espaco/**', 'brand/marmore-*', 'brand/*.png'],
        runtimeCaching: [
          {
            urlPattern: ({ request, sameOrigin }) => sameOrigin && request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'imagens',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
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
