import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  headingLevel = 'h2',
}: {
  icon?: ReactNode;
  title: string;
  headingLevel?: 'h1' | 'h2' | 'h3';
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center', className)}>
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-6" aria-hidden>
        {icon ?? <Inbox />}
      </div>
      <div className="space-y-1">
        {headingLevel === 'h1' ? (
          <h1 className="text-lg font-semibold">{title}</h1>
        ) : headingLevel === 'h3' ? (
          <h3 className="font-medium">{title}</h3>
        ) : (
          <h2 className="font-medium">{title}</h2>
        )}
        {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry, className }: { error: unknown; onRetry?: () => void; className?: string }) {
  const { t } = useTranslation();
  const code = error instanceof ApiError ? error.code : 'INTERNAL_ERROR';
  return (
    <div role="alert" className={cn('flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-8 text-center', className)}>
      <AlertTriangle className="size-8 text-destructive" aria-hidden />
      <div className="space-y-1">
        <p className="font-medium">{t('common.errorTitle')}</p>
        <p className="text-sm text-muted-foreground">{t(`errors.${code}`, { defaultValue: t('errors.INTERNAL_ERROR') })}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw aria-hidden /> {t('common.retry')}
        </Button>
      )}
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
