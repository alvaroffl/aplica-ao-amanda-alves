import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { PublicLayout } from '@/features/public/PublicLayout';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <PublicLayout>
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-6xl font-bold text-primary">404</p>
        <h1 className="text-2xl font-semibold">{t('common.notFoundTitle')}</h1>
        <p className="text-muted-foreground">{t('common.notFoundText')}</p>
        <Button asChild>
          <Link to="/">{t('common.goHome')}</Link>
        </Button>
      </div>
    </PublicLayout>
  );
}
