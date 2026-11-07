import { addDaysToKey, localDateKey, todayKey, type PublicBooking } from '@agendae/shared';
import { useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { EmptyState, ErrorState } from '@/components/common/States';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api';
import { rescheduleByToken, useRescheduleSlots } from '../public/api';
import { DateStrip } from '../public/DateStrip';
import { SlotPicker } from '../public/SlotPicker';
import { TimezoneNotice } from '../public/TimezoneNotice';

const PAGE = 14;

export function ReschedulePanel({
  booking,
  onDone,
}: {
  booking: PublicBooking;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const tz = booking.unit.timezone;
  const today = todayKey(tz);
  const [start, setStart] = React.useState(today);
  const [day, setDay] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const slots = useRescheduleSlots(
    booking.manage_token,
    start,
    addDaysToKey(start, PAGE - 1),
    true,
  );

  const byDay = React.useMemo(() => {
    const map = new Map<string, { starts_at: string; ends_at: string }[]>();
    for (const s of slots.data ?? []) {
      if (s.starts_at === booking.starts_at) continue;
      const key = localDateKey(s.starts_at, tz);
      map.set(key, [...(map.get(key) ?? []), s]);
    }
    return map;
  }, [slots.data, tz, booking.starts_at]);
  const available = React.useMemo(() => new Set(byDay.keys()), [byDay]);
  const activeDay = day && available.has(day) ? day : ([...available].sort()[0] ?? null);

  const confirm = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await rescheduleByToken(booking.manage_token, selected);
      await qc.invalidateQueries({ queryKey: ['booking-token'] });
      toast.success(t('manage.rescheduled'));
      onDone();
    } catch (e) {
      const code = e instanceof ApiError ? e.code : 'INTERNAL_ERROR';
      toast.error(t(`errors.${code}`, { defaultValue: t('errors.INTERNAL_ERROR') }));
      await slots.refetch();
      setSelected(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <DateStrip
        start={start}
        days={PAGE}
        selected={activeDay}
        available={available}
        loading={slots.isFetching && !slots.data}
        timeZone={tz}
        minDate={today}
        onSelect={(d) => {
          setDay(d);
          setSelected(null);
        }}
        onPage={(dir) => {
          const next = addDaysToKey(start, dir * PAGE);
          setStart(next < today ? today : next);
        }}
      />
      <TimezoneNotice timeZone={tz} unitName={booking.unit.name} />
      {slots.isError ? (
        <ErrorState error={slots.error} onRetry={() => void slots.refetch()} />
      ) : !slots.data ? (
        <Skeleton className="h-32" />
      ) : !activeDay ? (
        <EmptyState title={t('booking.noSlotsRange')} />
      ) : (
        <SlotPicker
          slots={byDay.get(activeDay) ?? []}
          timeZone={tz}
          selected={selected}
          onSelect={(s) => setSelected(s.starts_at)}
        />
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onDone}>
          {t('common.cancel')}
        </Button>
        <Button onClick={confirm} disabled={!selected} loading={saving}>
          {t('manage.confirmReschedule')}
        </Button>
      </div>
    </div>
  );
}
