import { formatDuration, formatLongDate, formatMoney, formatTime, type PublicBusiness } from '@agendae/shared';
import { CalendarDays, Clock, MapPin, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';

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
    <Card className="p-4">
      <h2 className="sr-only">{t('booking.summary')}</h2>
      <p className="font-semibold">{service.name}</p>
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
              <CalendarDays className="size-4 text-primary" aria-hidden />
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
        <span className="font-semibold tabular-nums">{formatMoney(service.price_cents, currency)}</span>
      </div>
      {service.deposit_cents > 0 && (
        <div className="mt-1 flex items-baseline justify-between text-sm">
          <span className="text-muted-foreground">{t('booking.depositNow')}</span>
          <span className="font-medium tabular-nums text-primary">{formatMoney(service.deposit_cents, currency)}</span>
        </div>
      )}
    </Card>
  );
}
