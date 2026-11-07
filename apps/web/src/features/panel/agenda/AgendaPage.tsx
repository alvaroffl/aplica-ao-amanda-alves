import type {
  DateSelectArg,
  DatesSetArg,
  EventClickArg,
  EventDropArg,
  EventInput,
} from '@fullcalendar/core';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { type EventResizeDoneArg } from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ErrorState } from '@/components/common/States';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { toApiError } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useBusiness } from '../business';
import { useBookings, useProfessionals, type BookingRow } from '../data';
import { BookingDetailsDialog } from './BookingDetailsDialog';
import { NewBookingDialog, type NewBookingDefaults } from './NewBookingDialog';
import { fromWall, toWall } from './wallTime';

type View = 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth' | 'listWeek';

export function AgendaPage() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const { business, can, myProfessionalId } = useBusiness();
  const tz = business.timezone;
  const calendarRef = React.useRef<FullCalendar>(null);
  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  const [view, setView] = React.useState<View>(isMobile ? 'timeGridDay' : 'timeGridWeek');
  const [title, setTitle] = React.useState('');
  const [range, setRange] = React.useState(() => {
    const now = new Date();
    return {
      from: new Date(now.getTime() - 7 * 864e5).toISOString(),
      to: new Date(now.getTime() + 7 * 864e5).toISOString(),
    };
  });
  const [proFilter, setProFilter] = React.useState<string>(
    can('agenda.viewAll') ? 'all' : (myProfessionalId ?? 'all'),
  );
  const [showCancelled, setShowCancelled] = React.useState(false);
  const [selected, setSelected] = React.useState<BookingRow | null>(null);
  const [creating, setCreating] = React.useState<NewBookingDefaults | null>(null);

  const bookings = useBookings(range.from, range.to);
  const professionals = useProfessionals();

  React.useEffect(() => {
    document.title = `${t('panel.nav.agenda')} — ${business.name}`;
  }, [t, business.name]);

  const events: EventInput[] = React.useMemo(
    () =>
      (bookings.data ?? [])
        .filter((b) => (proFilter === 'all' ? true : b.professional_id === proFilter))
        .filter((b) => showCancelled || b.status !== 'cancelled')
        .map((b) => {
          const editable = b.status === 'confirmed' || b.status === 'pending_payment';
          return {
            id: b.id,
            title: `${b.client?.name ?? '—'} · ${b.service?.name ?? ''}`,
            start: toWall(b.starts_at, tz),
            end: toWall(b.ends_at, tz),
            backgroundColor: b.professional?.color ?? '#6366f1',
            textColor: '#fff',
            editable,
            classNames: [
              b.status === 'completed' || b.status === 'no_show' ? 'is-muted' : '',
              b.status === 'cancelled' ? 'is-muted is-cancelled' : '',
              b.status === 'pending_payment' ? 'opacity-80' : '',
            ].filter(Boolean),
            extendedProps: { booking: b },
          };
        }),
    [bookings.data, proFilter, showCancelled, tz],
  );

  const api = () => calendarRef.current?.getApi();

  const onDatesSet = (arg: DatesSetArg) => {
    setTitle(arg.view.title);
    const from = fromWall(arg.start, tz).toISOString();
    const to = fromWall(arg.end, tz).toISOString();
    setRange((r) => (r.from === from && r.to === to ? r : { from, to }));
  };

  const persistMove = async (info: EventDropArg | EventResizeDoneArg) => {
    const booking = info.event.extendedProps.booking as BookingRow;
    if (!info.event.start || !info.event.end) return info.revert();
    const startsAt = fromWall(info.event.start, tz).toISOString();
    const endsAt = fromWall(info.event.end, tz).toISOString();
    const { error } = await supabase
      .from('bookings')
      .update({ starts_at: startsAt, ends_at: endsAt })
      .eq('id', booking.id);
    if (error) {
      info.revert();
      const code = toApiError(error).code;
      toast.error(t(`errors.${code}`, { defaultValue: t('errors.INTERNAL_ERROR') }));
      return;
    }
    toast.success(t('agenda.moved'), { description: t('agenda.movedHint') });
    void qc.invalidateQueries({ queryKey: ['bookings', business.id] });
  };

  const onSelect = (arg: DateSelectArg) => {
    const iso = arg.start.toISOString();
    setCreating({
      date: iso.slice(0, 10),
      time: arg.allDay ? '09:00' : iso.slice(11, 16),
      professionalId: proFilter !== 'all' ? proFilter : undefined,
    });
    api()?.unselect();
  };

  const onEventClick = (arg: EventClickArg) => {
    arg.jsEvent.preventDefault();
    setSelected(arg.event.extendedProps.booking as BookingRow);
  };

  const changeView = (v: View) => {
    setView(v);
    api()?.changeView(v);
  };

  const wallNow = () => new Date(toWall(new Date(), tz));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="sr-only">{t('panel.nav.agenda')}</h1>
          <Button
            variant="outline"
            size="icon"
            onClick={() => api()?.prev()}
            aria-label={t('agenda.previous')}
          >
            <ChevronLeft aria-hidden />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => api()?.next()}
            aria-label={t('agenda.next')}
          >
            <ChevronRight aria-hidden />
          </Button>
          <Button variant="outline" onClick={() => api()?.today()}>
            {t('agenda.today')}
          </Button>
          <p className="ml-1 text-lg font-semibold first-letter:uppercase" aria-live="polite">
            {title}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented<View>
            label={t('agenda.viewLabel')}
            value={view}
            onChange={changeView}
            options={[
              { value: 'timeGridDay', label: t('agenda.views.day') },
              { value: 'timeGridWeek', label: t('agenda.views.week') },
              { value: 'dayGridMonth', label: t('agenda.views.month') },
              { value: 'listWeek', label: t('agenda.views.list') },
            ]}
          />
          <Button
            onClick={() =>
              setCreating({ date: wallNow().toISOString().slice(0, 10), time: '09:00' })
            }
          >
            <Plus aria-hidden /> {t('agenda.newBooking')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {can('agenda.viewAll') && (
          <NativeSelect
            value={proFilter}
            onChange={(e) => setProFilter(e.target.value)}
            aria-label={t('agenda.filterProfessional')}
            className="w-auto min-w-48"
          >
            <option value="all">{t('agenda.allProfessionals')}</option>
            {(professionals.data ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </NativeSelect>
        )}
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            className="size-4 accent-[var(--primary)]"
            checked={showCancelled}
            onChange={(e) => setShowCancelled(e.target.checked)}
          />
          {t('agenda.showCancelled')}
        </label>
        <div
          className="flex flex-wrap gap-3 text-xs text-muted-foreground"
          aria-label={t('agenda.legend')}
        >
          {(professionals.data ?? [])
            .filter((p) => p.active)
            .map((p) => (
              <span key={p.id} className="inline-flex items-center gap-1.5">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: p.color }}
                  aria-hidden
                />
                {p.name}
              </span>
            ))}
        </div>
      </div>

      {bookings.isError && (
        <ErrorState error={bookings.error} onRetry={() => void bookings.refetch()} />
      )}

      <div className="rounded-xl border bg-card p-2 sm:p-3" aria-busy={bookings.isFetching}>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView={view}
          timeZone="UTC"
          now={wallNow}
          locale={i18n.language.startsWith('pt') ? ptBrLocale : undefined}
          headerToolbar={false}
          height="auto"
          expandRows
          allDaySlot={false}
          nowIndicator
          slotMinTime="06:00:00"
          slotMaxTime="23:00:00"
          scrollTime="08:00:00"
          slotDuration="00:15:00"
          slotLabelInterval="01:00"
          snapDuration="00:05:00"
          eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          selectable
          selectMirror
          editable
          eventDurationEditable
          longPressDelay={350}
          dayMaxEventRows={4}
          events={events}
          datesSet={onDatesSet}
          eventDrop={persistMove}
          eventResize={persistMove}
          select={onSelect}
          eventClick={onEventClick}
          noEventsContent={t('agenda.empty')}
        />
      </div>

      <BookingDetailsDialog booking={selected} onClose={() => setSelected(null)} />
      <NewBookingDialog defaults={creating} onClose={() => setCreating(null)} />
    </div>
  );
}
