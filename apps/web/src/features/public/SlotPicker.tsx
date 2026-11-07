import { formatTime, groupByPeriod, type DayPeriod } from '@agendae/shared';
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
              className="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
            >
              <Icon className="size-4" aria-hidden /> {t(`periods.${period}`)}
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
                      'h-11 rounded-lg border text-sm font-medium tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-ring',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'bg-card hover:border-primary/60 hover:bg-accent',
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
