import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router';
import { Spinner } from '@/components/ui/skeleton';
import { useAuth } from '@/providers/auth';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();
  if (loading) return <Spinner className="min-h-dvh" label={t('common.loading')} />;
  if (!user)
    return <Navigate to="/entrar" replace state={{ from: location.pathname + location.search }} />;
  return <>{children}</>;
}
