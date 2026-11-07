import { buildIcs, googleCalendarUrl, whatsappShareUrl } from '@agendae/shared/calendar';
import { formatLongDate, formatTime } from '@agendae/shared/datetime';
import type { PublicBooking } from '@agendae/shared';
import { CalendarPlus, Download, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { env, publicUrl } from '@/lib/env';

export function CalendarActions({ booking }: { booking: PublicBooking }) {
  const { t } = useTranslation();
  const where = [booking.unit.name, booking.unit.address].filter(Boolean).join(' — ');
  const manage = publicUrl(`/r/${booking.manage_token}`);
  const event = {
    start: booking.starts_at,
    end: booking.ends_at,
    title: `${booking.service.name} — ${booking.business.name}`,
    description: `${t('booking.with')} ${booking.professional.name}. ${t('manage.manageAt')}: ${manage}`,
    location: where,
  };

  const downloadIcs = () => {
    const ics = buildIcs({ ...event, uid: `${booking.id}@agendae`, url: manage }, env.appName);
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: 'agendamento.ics',
    });
    a.click();
    URL.revokeObjectURL(url);
  };

  const tz = booking.unit.timezone;
  const shareText = t('manage.shareText', {
    service: booking.service.name,
    business: booking.business.name,
    when: `${formatLongDate(booking.starts_at, tz)} ${t('booking.at')} ${formatTime(booking.starts_at, tz)}`,
    link: manage,
  });

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <Button variant="outline" asChild>
        <a href={googleCalendarUrl(event)} target="_blank" rel="noreferrer">
          <CalendarPlus aria-hidden /> {t('manage.googleCalendar')}
        </a>
      </Button>
      <Button variant="outline" onClick={downloadIcs}>
        <Download aria-hidden /> {t('manage.downloadIcs')}
      </Button>
      <Button variant="outline" asChild>
        <a href={whatsappShareUrl(shareText)} target="_blank" rel="noreferrer">
          <Share2 aria-hidden /> {t('manage.shareWhatsApp')}
        </a>
      </Button>
    </div>
  );
}
