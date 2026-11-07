import { addDaysToKey, localDateKey, todayKey } from '@agendae/shared/datetime';
import type { Slot } from '@agendae/shared';
import { CalendarX } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, ErrorState } from '@/components/common/States';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSlots } from './api';
import { DateStrip } from './DateStrip';
import { SlotPicker } from './SlotPicker';
import { TimezoneNotice } from './TimezoneNotice';

const PAGE = 14;

export function StepDateTime({
  serviceId,
  unitId,
  unitName,
  timeZone,
  professionalId,
  selectedDay,
  onSelectDay,
  onSelectSlot,
}: {
  serviceId: string;
  unitId: string;
  unitName: string;
  timeZone: string;
  professionalId: string | null;
  selectedDay: string | null;
  onSelectDay: (day: string) => void;
  onSelectSlot: (slot: Slot) => void;
}) {
  const { t } = useTranslation();
  const today = todayKey(timeZone);
  const [start, setStart] = React.useState(() =>
    selectedDay && selectedDay > today
      ? addDaysToKey(selectedDay, -Math.min(3, daysBetween(today, selectedDay)))
      : today,
  );
  const to = addDaysToKey(start, PAGE - 1);
  const slots = useSlots({ serviceId, unitId, professionalId, from: start, to });

  // Agrupa por dia local; com "qualquer profissional", um horário aparece uma vez.
  const byDay = React.useMemo(() => {
    const map = new Map<string, Slot[]>();
    const seen = new Set<string>();
    for (const s of slots.data ?? []) {
      if (seen.has(s.starts_at)) continue;
      seen.add(s.starts_at);
      const key = localDateKey(s.starts_at, timeZone);
      map.set(key, [...(map.get(key) ?? []), s]);
    }
    return map;
  }, [slots.data, timeZone]);

  const available = React.useMemo(() => new Set(byDay.keys()), [byDay]);
  const firstAvailable = [...available].sort()[0];
  const day = selectedDay && available.has(selectedDay) ? selectedDay : null;

  // Seleciona automaticamente o primeiro dia com horários
  React.useEffect(() => {
    if (!slots.isFetching && !day && firstAvailable) onSelectDay(firstAvailable);
  }, [slots.isFetching, day, firstAvailable, onSelectDay]);

  return (
    <div className="space-y-5">
      <DateStrip
        start={start}
        days={PAGE}
        selected={day}
        available={available}
        loading={slots.isFetching && !slots.data}
        timeZone={timeZone}
        minDate={today}
        onSelect={onSelectDay}
        onPage={(dir) => {
          const next = addDaysToKey(start, dir * PAGE);
          setStart(next < today ? today : next);
        }}
      />
      <TimezoneNotice timeZone={timeZone} unitName={unitName} />

      <div aria-live="polite" aria-busy={slots.isFetching}>
        {slots.isError ? (
          <ErrorState error={slots.error} onRetry={() => void slots.refetch()} />
        ) : !slots.data ? (
          <div
            className="grid grid-cols-3 gap-2 sm:grid-cols-5"
            role="status"
            aria-label={t('booking.loadingSlots')}
          >
            {Array.from({ length: 10 }, (_, i) => (
              <Skeleton key={i} className="h-11" />
            ))}
          </div>
        ) : available.size === 0 ? (
          <EmptyState
            icon={<CalendarX />}
            title={t('booking.noSlotsRange')}
            description={t('booking.noSlotsRangeHint')}
            action={
              <Button variant="outline" onClick={() => setStart(addDaysToKey(start, PAGE))}>
                {t('booking.nextDates')}
              </Button>
            }
          />
        ) : day ? (
          <SlotPicker
            slots={byDay.get(day) ?? []}
            timeZone={timeZone}
            selected={null}
            onSelect={onSelectSlot}
          />
        ) : null}
      </div>
    </div>
  );
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);
}
