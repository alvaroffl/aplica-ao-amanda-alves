import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export type ProgressStep = 'service' | 'professional' | 'datetime' | 'details' | 'confirm';

/**
 * Progresso do agendamento: fio de ouro que avança a cada passo e etapas
 * nomeadas (no celular ficam só os números; o nome do passo atual aparece no
 * título). `index` = passo atual; `index === steps.length` = tudo concluído.
 */
export function BookingProgress({
  steps,
  index,
  className,
}: {
  steps: ProgressStep[];
  index: number;
  className?: string;
}) {
  const { t } = useTranslation();
  const fill = Math.min(1, (index + 1) / steps.length);
  return (
    <nav aria-label={t('booking.progress')} className={className}>
      <div className="relative h-[3px] overflow-hidden rounded-full bg-border" aria-hidden>
        <div
          className="absolute inset-0 origin-left bg-[image:var(--gold-metal)] transition-transform duration-700 ease-[var(--ease-out)] motion-reduce:transition-none"
          style={{ transform: `scaleX(${fill})` }}
        />
      </div>
      <ol
        className="mt-3 grid gap-2"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map((s, i) => {
          const state = i < index ? 'done' : i === index ? 'current' : 'todo';
          return (
            <li
              key={s}
              aria-current={state === 'current' ? 'step' : undefined}
              className={cn(
                'flex min-w-0 items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em]',
                state === 'todo' ? 'text-muted-foreground' : 'text-gold-text',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] tabular-nums tracking-normal transition-colors duration-500',
                  state === 'done' && 'border-transparent bg-[image:var(--gold-metal)] text-ink',
                  state === 'current' && 'border-gold bg-card text-gold-text',
                  state === 'todo' && 'border-border bg-card',
                )}
              >
                {state === 'done' ? <Check className="size-3.5" strokeWidth={2.5} /> : i + 1}
              </span>
              <span className="truncate max-sm:sr-only">{t(`booking.steps.${s}`)}</span>
              <span className="sr-only">
                {state === 'done'
                  ? t('booking.stepDone')
                  : state === 'current'
                    ? t('booking.stepCurrent')
                    : ''}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
