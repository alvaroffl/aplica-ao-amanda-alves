import { browserTimeZone, sameOffset, timeZoneLabel } from '@agendae/shared';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Atendimento presencial: horários sempre no fuso da unidade.
 * Se o aparelho estiver em outro fuso, avisamos (evita a confusão mais
 * reclamada em plataformas de agendamento).
 */
export function TimezoneNotice({ timeZone, unitName }: { timeZone: string; unitName: string }) {
  const { t, i18n } = useTranslation();
  const mine = browserTimeZone();
  const label = timeZoneLabel(timeZone, i18n.language);
  if (sameOffset(mine, timeZone)) {
    return <p className="text-xs text-muted-foreground">{t('booking.timesIn', { zone: label })}</p>;
  }
  return (
    <p className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
      <Globe className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
      <span>{t('booking.tzNotice', { unit: unitName, zone: label, yourZone: timeZoneLabel(mine, i18n.language) })}</span>
    </p>
  );
}
