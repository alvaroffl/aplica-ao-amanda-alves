import { formatTime, groupByPeriod } from '@agendae/shared/datetime';
import type { DayPeriod } from '@agendae/shared';
import { Moon, Sun, Sunrise } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const ICONS: Record<DayPeriod, typeof Sun> = { morning: Sunrise, afternoon: Sun, evening: Moon };

export function SlotPicker<T extends { starts_at: string }>({
  slots,
  timeZone,
  selected,
  onSelect,
}: {
  slots: T[];
  timeZone: string;
  selected: string | null;
  onSelect: (slot: T) => void;
}) {
  const { t } = useTranslation();
  const groups = groupByPeriod(slots, timeZone);
  return (
    <div className="space-y-5">
      {(Object.keys(groups) as DayPeriod[]).map((period) => {
        const items = groups[period];
        if (items.length === 0) return null;
        const Icon = ICONS[period];
        return (
          <section key={period} aria-labelledby={`period-${period}`}>
            <h3
              id={`period-${period}`}
              className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground"
            >
              <Icon className="size-4 text-gold-text" aria-hidden /> {t(`periods.${period}`)}
            </h3>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {items.map((slot) => {
                const isSelected = slot.starts_at === selected;
                return (
                  <button
                    key={slot.starts_at}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onSelect(slot)}
                    className={cn(
                      'h-11 rounded-full border text-sm font-medium tabular-nums',
                      'transition-[transform,border-color,color,box-shadow] duration-300 ease-[var(--ease-out)] active:scale-95 motion-reduce:transform-none',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                      isSelected
                        ? 'border-transparent bg-[image:var(--gold-button)] text-ink shadow-[var(--shadow-gold)]'
                        : 'bg-card hover:-translate-y-px hover:border-gold hover:text-gold-text hover:shadow-[var(--shadow-soft)]',
                    )}
                  >
                    {formatTime(slot.starts_at, timeZone)}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
