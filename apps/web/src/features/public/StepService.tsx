import { formatDuration } from '@agendae/shared/datetime';
import { formatMoney } from '@agendae/shared/money';
import type { PublicBusiness } from '@agendae/shared';
import { ChevronRight, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/common/States';
import { Badge } from '@/components/ui/badge';

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

  return (
    <div className="space-y-6">
      {[...groups.entries()].map(([category, items]) => (
        <section key={category} aria-labelledby={`cat-${category}`}>
          {groups.size > 1 && (
            <h3 id={`cat-${category}`} className="mb-2 text-sm font-medium text-muted-foreground">
              {category}
            </h3>
          )}
          <ul className="divide-y overflow-hidden rounded-xl border bg-card">
            {items.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onSelect(s)}
                  className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{s.name}</p>
                    {s.description && (
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                        {s.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3.5" aria-hidden /> {formatDuration(s.duration_min)}
                      </span>
                      {s.deposit_cents > 0 && (
                        <Badge variant="secondary">
                          {t('booking.depositBadge', {
                            amount: formatMoney(s.deposit_cents, currency),
                          })}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <span className="font-semibold tabular-nums">
                    {formatMoney(s.price_cents, currency)}
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
