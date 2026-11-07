import { FlaskConical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

/** Aviso claro de que a cobrança é de teste (sandbox) — usado na apresentação. */
export function TestModeNotice({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <p
      role="note"
      className={cn(
        'flex items-start gap-2 rounded-lg border border-dashed border-warning/60 bg-warning/10 px-3 py-2 text-sm',
        className,
      )}
    >
      <FlaskConical className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
      <span>
        <strong className="font-semibold">{t('payment.testModeTitle')}</strong>{' '}
        {t('payment.testModeText')}
      </span>
    </p>
  );
}
