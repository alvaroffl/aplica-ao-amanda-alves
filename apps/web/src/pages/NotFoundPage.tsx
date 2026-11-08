import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { PublicLayout } from '@/features/public/PublicLayout';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <PublicLayout>
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="font-display text-6xl text-gold-text">404</p>
        <p className="text-gold" aria-hidden>
          ✦
        </p>
        <h1 className="text-2xl">{t('common.notFoundTitle')}</h1>
        <p className="text-muted-foreground">{t('common.notFoundText')}</p>
        <Button asChild>
          <Link to="/">{t('common.goHome')}</Link>
        </Button>
      </div>
    </PublicLayout>
  );
}
