import { formatDuration } from '@agendae/shared/datetime';
import { formatMoney } from '@agendae/shared/money';
import type { PublicBusiness } from '@agendae/shared';
import { ChevronRight, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/common/States';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Service = PublicBusiness['services'][number];

export function StepService({
  services,
  currency,
  onSelect,
}: {
  services: Service[];
  currency: string;
  onSelect: (service: Service) => void;
}) {
  const { t } = useTranslation();
  if (services.length === 0) return <EmptyState title={t('booking.noServices')} />;

  const groups = new Map<string, Service[]>();
  for (const s of services) {
    const key = s.category || t('booking.otherServices');
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }

  const hasDemo = services.some((s) => s.is_demo);

  return (
    <div className="space-y-6">
      {hasDemo && (
        <p
          role="note"
          className="rounded-xl border border-dashed border-gold/40 px-3 py-2 text-xs text-muted-foreground"
        >
          {t('booking.demoPrices')}
        </p>
      )}
      {[...groups.entries()].map(([category, items]) => (
        <section key={category} aria-labelledby={`cat-${category}`}>
          {groups.size > 1 && (
            <h3 id={`cat-${category}`} className="eyebrow mb-3">
              {category}
            </h3>
          )}
          <ul className="space-y-3">
            {items.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onSelect(s)}
                  className={cn(
                    'group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border bg-card/90 px-5 py-4 text-left shadow-[var(--shadow-soft)]',
                    'transition-[transform,border-color,box-shadow] duration-300 ease-[var(--ease-out)]',
                    'hover:-translate-y-0.5 hover:border-gold/60 hover:shadow-[var(--shadow-lift)] active:scale-[0.99]',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transform-none',
                  )}
                >
                  {/* filete dourado que acende no hover */}
                  <span
                    aria-hidden
                    className="absolute inset-y-3 left-0 w-[2px] origin-center scale-y-0 rounded-full bg-[image:var(--gold-metal)] transition-transform duration-500 ease-[var(--ease-out)] group-hover:scale-y-100 group-focus-visible:scale-y-100"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg leading-snug">{s.name}</p>
                    {s.description && (
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                        {s.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3.5" aria-hidden /> {formatDuration(s.duration_min)}
                      </span>
                      {s.price_cents === 0 && (
                        <Badge variant="success">{t('booking.freeBadge')}</Badge>
                      )}
                      {s.deposit_cents > 0 && (
                        <Badge variant="secondary">
                          {t('booking.depositBadge', {
                            amount: formatMoney(s.deposit_cents, currency),
                          })}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <span className="font-display text-lg tabular-nums">
                    {s.price_cents === 0 ? t('booking.free') : formatMoney(s.price_cents, currency)}
                  </span>
                  <ChevronRight
                    className="size-4 text-gold-text transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
                    aria-hidden
                  />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
