import { formatDuration, formatLongDate, formatTime } from '@agendae/shared/datetime';
import { formatMoney } from '@agendae/shared/money';
import type { PublicBusiness } from '@agendae/shared';
import { CalendarDays, Clock, MapPin, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

type Service = PublicBusiness['services'][number];
type Professional = PublicBusiness['professionals'][number];
type Unit = PublicBusiness['units'][number];

export function BookingSummary({
  service,
  professional,
  anyProfessional,
  unit,
  startsAt,
  currency,
  showUnit,
}: {
  service?: Service;
  professional?: Professional;
  anyProfessional?: boolean;
  unit?: Unit;
  startsAt?: string | null;
  currency: string;
  showUnit: boolean;
}) {
  const { t } = useTranslation();
  if (!service) return null;
  return (
    <section className="relative overflow-hidden rounded-2xl border border-gold/30 bg-card/90 p-5 shadow-[var(--shadow-soft)]">
      <div className="gold-hairline absolute inset-x-0 top-0" aria-hidden />
      <h2 className="eyebrow font-sans">{t('booking.summary')}</h2>
      <p className="mt-2 font-display text-xl leading-snug">{service.name}</p>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <dt>
            <Clock className="size-4" aria-hidden />
            <span className="sr-only">{t('booking.duration')}</span>
          </dt>
          <dd>{formatDuration(service.duration_min)}</dd>
        </div>
        {(professional || anyProfessional) && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <dt>
              <User className="size-4" aria-hidden />
              <span className="sr-only">{t('booking.professional')}</span>
            </dt>
            <dd>{professional ? professional.name : t('booking.anyProfessional')}</dd>
          </div>
        )}
        {startsAt && unit && (
          <div className="flex items-center gap-2 font-medium text-foreground">
            <dt>
              <CalendarDays className="size-4 text-gold-text" aria-hidden />
              <span className="sr-only">{t('booking.when')}</span>
            </dt>
            <dd className="first-letter:uppercase">
              {formatLongDate(startsAt, unit.timezone)} · {formatTime(startsAt, unit.timezone)}
            </dd>
          </div>
        )}
        {showUnit && unit && (
          <div className="flex items-start gap-2 text-muted-foreground">
            <dt>
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span className="sr-only">{t('booking.unit')}</span>
            </dt>
            <dd>
              {unit.name}
              {unit.address ? ` — ${unit.address}` : ''}
            </dd>
          </div>
        )}
      </dl>
      <div className="mt-4 flex items-baseline justify-between border-t pt-3">
        <span className="text-sm text-muted-foreground">{t('booking.price')}</span>
        <span className="font-display text-xl tabular-nums">
          {service.price_cents === 0
            ? t('booking.free')
            : formatMoney(service.price_cents, currency)}
        </span>
      </div>
      {service.deposit_cents > 0 && (
        <div className="mt-1 flex items-baseline justify-between text-sm">
          <span className="text-muted-foreground">{t('booking.depositNow')}</span>
          <span className="font-medium tabular-nums text-gold-text">
            {formatMoney(service.deposit_cents, currency)}
          </span>
        </div>
      )}
    </section>
  );
}

/**
 * Resumo fixo do pedido no celular e tablet: uma linha discreta que fica
 * logo abaixo do cabeçalho enquanto a cliente rola (serviço, quando, valor).
 */
export function BookingSummaryBar({
  service,
  professional,
  unit,
  startsAt,
  currency,
}: {
  service: Service;
  professional?: Professional;
  unit?: Unit;
  startsAt?: string | null;
  currency: string;
}) {
  const { t } = useTranslation();
  const detail =
    startsAt && unit
      ? `${formatLongDate(startsAt, unit.timezone)} · ${formatTime(startsAt, unit.timezone)}`
      : [formatDuration(service.duration_min), professional?.name].filter(Boolean).join(' · ');
  return (
    <section
      aria-label={t('booking.summary')}
      className={cn(
        'sticky top-14 z-20 -mx-4 mb-6 flex items-center gap-3 border-b border-gold/25 px-4 py-2.5 lg:hidden',
        'bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75',
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{service.name}</p>
        <p className="truncate text-xs text-muted-foreground first-letter:uppercase">{detail}</p>
      </div>
      <p className="shrink-0 text-right">
        <span className="block font-display text-lg leading-tight tabular-nums">
          {service.price_cents === 0
            ? t('booking.free')
            : formatMoney(service.price_cents, currency)}
        </span>
        {service.deposit_cents > 0 && (
          <span className="block text-[11px] text-gold-text">
            {t('booking.depositBadge', { amount: formatMoney(service.deposit_cents, currency) })}
          </span>
        )}
      </p>
    </section>
  );
}
