import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { registerSW } from 'virtual:pwa-register';
import { router } from './app/router';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './i18n';
import './index.css';
import { queryClient } from './lib/query';
import { AuthProvider } from './providers/auth';
import { ThemeProvider, useTheme } from './providers/theme';

registerSW({ immediate: true });

function ThemedToaster() {
  const { resolved } = useTheme();
  return <Toaster theme={resolved} position="top-center" richColors closeButton />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RouterProvider router={router} />
            <ThemedToaster />
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
