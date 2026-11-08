import { addDaysToKey, formatInZone, zonedToUtc } from '@agendae/shared/datetime';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DateStripProps {
  start: string; // yyyy-MM-dd (primeiro dia visível)
  days: number;
  selected: string | null;
  available: Set<string>;
  loading?: boolean;
  timeZone: string;
  minDate: string;
  onSelect: (day: string) => void;
  onPage: (direction: -1 | 1) => void;
}

/** Faixa de datas rolável; dias sem horário ficam desabilitados. */
export function DateStrip({
  start,
  days,
  selected,
  available,
  loading,
  timeZone,
  minDate,
  onSelect,
  onPage,
}: DateStripProps) {
  const { t } = useTranslation();
  const keys = React.useMemo(
    () => Array.from({ length: days }, (_, i) => addDaysToKey(start, i)),
    [start, days],
  );
  const label = (key: string, pattern: string) =>
    formatInZone(zonedToUtc(key, '12:00', timeZone), timeZone, pattern);
  const monthLabel = label(keys[0]!, "MMMM 'de' yyyy");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium first-letter:uppercase" aria-live="polite">
          {monthLabel}
        </p>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onPage(-1)}
            disabled={start <= minDate}
            aria-label={t('booking.prevDates')}
          >
            <ChevronLeft aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onPage(1)}
            aria-label={t('booking.nextDates')}
          >
            <ChevronRight aria-hidden />
          </Button>
        </div>
      </div>
      <div
        role="listbox"
        tabIndex={0}
        aria-label={t('booking.chooseDate')}
        className="relative -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]"
      >
        {keys.map((key) => {
          const isAvailable = available.has(key);
          const isSelected = key === selected;
          return (
            <button
              key={key}
              type="button"
              role="option"
              aria-selected={isSelected}
              aria-disabled={!isAvailable}
              disabled={!isAvailable}
              onClick={() => onSelect(key)}
              className={cn(
                // formato de arco, como o espelho da entrada
                'flex w-14 shrink-0 snap-start flex-col items-center rounded-t-full rounded-b-2xl border px-1 pb-2 pt-3 text-center',
                'transition-[transform,background-color,border-color,box-shadow] duration-300 ease-[var(--ease-out)] motion-reduce:transform-none',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                isSelected
                  ? 'border-gold bg-primary text-primary-foreground shadow-[var(--shadow-gold)]'
                  : isAvailable
                    ? 'bg-card hover:-translate-y-0.5 hover:border-gold/70'
                    : 'cursor-not-allowed bg-muted/40 text-muted-foreground/60',
                loading && 'animate-pulse',
              )}
            >
              <span className="text-[11px] font-medium uppercase" aria-hidden>
                {label(key, 'EEEE').slice(0, 3)}
              </span>
              <span className="sr-only">{label(key, "EEEE, d 'de' MMMM")}</span>
              <span className="font-display text-xl leading-7" aria-hidden>
                {label(key, 'd')}
              </span>
              <span
                className={cn(
                  'mt-0.5 size-1.5 rounded-full',
                  isAvailable && !isSelected
                    ? 'bg-gold'
                    : isSelected
                      ? 'bg-gold-bright'
                      : 'bg-transparent',
                )}
                aria-hidden
              />
              <span className="sr-only">
                {isAvailable ? t('booking.dayAvailable') : t('booking.dayUnavailable')}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
