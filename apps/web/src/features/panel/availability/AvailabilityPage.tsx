import {
  WEEKDAYS_PT,
  formatDateTime,
  holidaySchema,
  timeOffSchema,
  weeklyAvailabilitySchema,
  zonedToUtc,
} from '@agendae/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarOff, Copy, Plus, Trash2, X } from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { z } from 'zod';
import { EmptyState, ErrorState, PageHeader } from '@/components/common/States';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input, NativeSelect } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toApiError, unwrap } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useBusiness } from '../business';
import { useProfessionals, useUnits } from '../data';

type Interval = { start: string; end: string };

export function AvailabilityPage() {
  const { t } = useTranslation();
  const { can, myProfessionalId } = useBusiness();
  const professionals = useProfessionals();
  const units = useUnits();
  const manageAll = can('availability.manageAll');
  const [proId, setProId] = React.useState<string | null>(null);
  const [unitId, setUnitId] = React.useState<string | null>(null);

  const pros = (professionals.data ?? []).filter(
    (p) => manageAll || can('timeoff.manageAll') || p.id === myProfessionalId,
  );
  const pro =
    pros.find((p) => p.id === proId) ?? pros.find((p) => p.id === myProfessionalId) ?? pros[0];
  const proUnits = (units.data ?? []).filter((u) => pro?.unit_ids.includes(u.id));
  const unit = proUnits.find((u) => u.id === unitId) ?? proUnits[0];

  if (professionals.isPending || units.isPending) return <Skeleton className="h-96" />;
  if (professionals.isError)
    return <ErrorState error={professionals.error} onRetry={() => void professionals.refetch()} />;

  const canEditRules = manageAll || pro?.id === myProfessionalId;

  return (
    <div className="space-y-6">
      <PageHeader title={t('availability.title')} description={t('availability.subtitle')} />
      {!pro ? (
        <EmptyState title={t('availability.noProfessional')} />
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            {pros.length > 1 && (
              <NativeSelect
                value={pro.id}
                onChange={(e) => setProId(e.target.value)}
                aria-label={t('availability.professional')}
                className="w-auto min-w-52"
              >
                {pros.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </NativeSelect>
            )}
            {proUnits.length > 1 && (
              <NativeSelect
                value={unit?.id}
                onChange={(e) => setUnitId(e.target.value)}
                aria-label={t('availability.unit')}
                className="w-auto min-w-44"
              >
                {proUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </NativeSelect>
            )}
          </div>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            {unit ? (
              <WeeklyEditor
                key={`${pro.id}:${unit.id}`}
                professionalId={pro.id}
                unitId={unit.id}
                readOnly={!canEditRules}
              />
            ) : (
              <EmptyState title={t('availability.noUnit')} />
            )}
            <div className="space-y-6">
              <TimeOffCard
                professionalId={pro.id}
                timeZone={unit?.timezone ?? 'America/Sao_Paulo'}
              />
              {manageAll && <HolidaysCard />}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function WeeklyEditor({
  professionalId,
  unitId,
  readOnly,
}: {
  professionalId: string;
  unitId: string;
  readOnly: boolean;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const rules = useQuery({
    queryKey: ['rules', professionalId, unitId],
    queryFn: async () =>
      unwrap(
        await supabase
          .from('availability_rules')
          .select('weekday, start_time, end_time')
          .eq('professional_id', professionalId)
          .eq('unit_id', unitId)
          .order('start_time'),
      ),
  });
  const [days, setDays] = React.useState<Interval[][] | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!rules.data) return;
    const d: Interval[][] = Array.from({ length: 7 }, () => []);
    for (const r of rules.data)
      d[r.weekday]!.push({ start: r.start_time.slice(0, 5), end: r.end_time.slice(0, 5) });
    setDays(d);
  }, [rules.data]);

  if (rules.isError) return <ErrorState error={rules.error} onRetry={() => void rules.refetch()} />;
  if (!days) return <Skeleton className="h-96" />;

  const update = (d: number, fn: (list: Interval[]) => Interval[]) =>
    setDays((prev) => prev!.map((list, i) => (i === d ? fn(list) : list)));

  const copyMondayToWeekdays = () =>
    setDays((prev) =>
      prev!.map((list, i) => (i >= 1 && i <= 5 ? prev![1]!.map((x) => ({ ...x })) : list)),
    );

  const save = async () => {
    const parsed = weeklyAvailabilitySchema.safeParse({ unitId, days });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'validation.invalid');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const payload = days.flatMap((list, weekday) =>
        list.map((i) => ({ weekday, start: i.start, end: i.end })),
      );
      unwrap(
        await supabase.rpc('set_weekly_availability', {
          p_professional_id: professionalId,
          p_unit_id: unitId,
          p_rules: payload,
        }),
      );
      await qc.invalidateQueries({ queryKey: ['rules', professionalId, unitId] });
      toast.success(t('availability.saved'));
    } catch (e) {
      toast.error(t(`errors.${toApiError(e).code}`, { defaultValue: t('errors.INTERNAL_ERROR') }));
    } finally {
      setSaving(false);
    }
  };

  // Ordem de exibição: segunda → domingo
  const order = [1, 2, 3, 4, 5, 6, 0];

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-2 space-y-0">
        <div className="min-w-0">
          <CardTitle>{t('availability.weekly')}</CardTitle>
          <CardDescription>{t('availability.weeklyHint')}</CardDescription>
        </div>
        {!readOnly && (
          <Button variant="ghost" size="sm" onClick={copyMondayToWeekdays}>
            <Copy aria-hidden /> {t('availability.copyMonday')}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-1">
        {order.map((d) => (
          <div
            key={d}
            className="flex flex-col gap-2 border-b py-3 last:border-0 sm:flex-row sm:items-start"
          >
            <p className="w-24 shrink-0 pt-2 text-sm font-medium">{WEEKDAYS_PT[d]}</p>
            <div className="flex-1 space-y-2">
              {days[d]!.length === 0 && (
                <p className="pt-2 text-sm text-muted-foreground">{t('availability.closed')}</p>
              )}
              {days[d]!.map((interval, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={interval.start}
                    disabled={readOnly}
                    aria-label={`${WEEKDAYS_PT[d]} ${t('availability.start')} ${i + 1}`}
                    onChange={(e) =>
                      update(d, (l) =>
                        l.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)),
                      )
                    }
                    className="w-[7.5rem] min-w-0"
                  />
                  <span className="text-muted-foreground" aria-hidden>
                    –
                  </span>
                  <Input
                    type="time"
                    value={interval.end}
                    disabled={readOnly}
                    aria-label={`${WEEKDAYS_PT[d]} ${t('availability.end')} ${i + 1}`}
                    onChange={(e) =>
                      update(d, (l) =>
                        l.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)),
                      )
                    }
                    className="w-[7.5rem] min-w-0"
                  />
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => update(d, (l) => l.filter((_, j) => j !== i))}
                      aria-label={t('availability.removeInterval')}
                    >
                      <X aria-hidden />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {!readOnly && (
              <Button
                variant="ghost"
                size="sm"
                className="self-start"
                aria-label={`${t('availability.addInterval')} — ${WEEKDAYS_PT[d]}`}
                onClick={() =>
                  update(d, (l) => [
                    ...l,
                    l.length
                      ? { start: l[l.length - 1]!.end, end: '18:00' }
                      : { start: '09:00', end: '18:00' },
                  ])
                }
              >
                <Plus aria-hidden />
                <span aria-hidden className="sm:hidden 2xl:inline">
                  {t('availability.addInterval')}
                </span>
              </Button>
            )}
          </div>
        ))}
        {error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {t(error)}
          </p>
        )}
        {!readOnly && (
          <div className="flex justify-end pt-3">
            <Button onClick={save} loading={saving}>
              {t('common.save')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type TimeOffForm = z.input<typeof timeOffSchema>;

function TimeOffCard({ professionalId, timeZone }: { professionalId: string; timeZone: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { business } = useBusiness();
  const list = useQuery({
    queryKey: ['time-off', professionalId],
    queryFn: async () =>
      unwrap(
        await supabase
          .from('time_off')
          .select('*')
          .eq('professional_id', professionalId)
          .gte('ends_at', new Date().toISOString())
          .order('starts_at'),
      ),
  });
  const today = new Date().toISOString().slice(0, 10);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TimeOffForm, unknown, z.output<typeof timeOffSchema>>({
    resolver: zodResolver(timeOffSchema),
    defaultValues: {
      professional_id: professionalId,
      kind: 'block',
      start_date: today,
      start_time: '12:00',
      end_date: today,
      end_time: '13:00',
      reason: '',
    },
  });

  const onSubmit = handleSubmit(async (v) => {
    try {
      unwrap(
        await supabase.from('time_off').insert({
          business_id: business.id,
          professional_id: professionalId,
          kind: v.kind,
          starts_at: zonedToUtc(v.start_date, v.start_time, timeZone).toISOString(),
          ends_at: zonedToUtc(v.end_date, v.end_time, timeZone).toISOString(),
          reason: v.reason || null,
        }),
      );
      toast.success(t('common.saved'));
      reset({ ...v, reason: '' });
      await qc.invalidateQueries({ queryKey: ['time-off', professionalId] });
    } catch (e) {
      toast.error(t(`errors.${toApiError(e).code}`));
    }
  });

  const remove = async (id: string) => {
    const { error } = await supabase.from('time_off').delete().eq('id', id);
    if (error) toast.error(t(`errors.${toApiError(error).code}`));
    await qc.invalidateQueries({ queryKey: ['time-off', professionalId] });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('availability.timeOff')}</CardTitle>
        <CardDescription>{t('availability.timeOffHint')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input type="hidden" {...register('professional_id')} value={professionalId} />
          <Field label={t('availability.kind')} htmlFor="kind" className="sm:col-span-2">
            <NativeSelect {...register('kind')}>
              <option value="block">{t('availability.kinds.block')}</option>
              <option value="time_off">{t('availability.kinds.time_off')}</option>
            </NativeSelect>
          </Field>
          <Field
            label={t('availability.startDate')}
            htmlFor="start_date"
            error={errors.start_date?.message}
          >
            <Input type="date" {...register('start_date')} />
          </Field>
          <Field
            label={t('availability.start')}
            htmlFor="start_time"
            error={errors.start_time?.message}
          >
            <Input type="time" {...register('start_time')} />
          </Field>
          <Field
            label={t('availability.endDate')}
            htmlFor="end_date"
            error={errors.end_date?.message}
          >
            <Input type="date" {...register('end_date')} />
          </Field>
          <Field label={t('availability.end')} htmlFor="end_time" error={errors.end_time?.message}>
            <Input type="time" {...register('end_time')} />
          </Field>
          <Field
            label={`${t('availability.reason')} (${t('common.optional')})`}
            htmlFor="reason"
            className="sm:col-span-2"
          >
            <Input {...register('reason')} />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" variant="secondary" loading={isSubmitting}>
              <Plus aria-hidden /> {t('availability.addTimeOff')}
            </Button>
          </div>
        </form>
        <ul className="space-y-2">
          {(list.data ?? []).map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
              <CalendarOff className="size-4 text-muted-foreground" aria-hidden />
              <div className="min-w-0 flex-1">
                <p>
                  {formatDateTime(item.starts_at, timeZone)} →{' '}
                  {formatDateTime(item.ends_at, timeZone)}
                </p>
                <p className="text-xs text-muted-foreground">
                  <Badge variant="secondary" className="mr-1">
                    {t(`availability.kinds.${item.kind}`)}
                  </Badge>
                  {item.reason}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => void remove(item.id)}
                aria-label={t('common.delete')}
              >
                <Trash2 aria-hidden />
              </Button>
            </li>
          ))}
          {list.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">{t('availability.noTimeOff')}</p>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

type HolidayForm = z.input<typeof holidaySchema>;

function HolidaysCard() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { business } = useBusiness();
  const units = useUnits();
  const list = useQuery({
    queryKey: ['holidays', business.id],
    queryFn: async () =>
      unwrap(
        await supabase
          .from('holidays')
          .select('*')
          .eq('business_id', business.id)
          .gte('date', new Date().toISOString().slice(0, 10))
          .order('date'),
      ),
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HolidayForm, unknown, z.output<typeof holidaySchema>>({
    resolver: zodResolver(holidaySchema),
    defaultValues: { date: '', name: '', unit_id: null },
  });

  const onSubmit = handleSubmit(async (v) => {
    try {
      unwrap(
        await supabase
          .from('holidays')
          .insert({ business_id: business.id, date: v.date, name: v.name, unit_id: v.unit_id }),
      );
      reset({ date: '', name: '', unit_id: null });
      await qc.invalidateQueries({ queryKey: ['holidays', business.id] });
      toast.success(t('common.saved'));
    } catch (e) {
      toast.error(t(`errors.${toApiError(e).code}`));
    }
  });

  const remove = async (id: string) => {
    await supabase.from('holidays').delete().eq('id', id);
    await qc.invalidateQueries({ queryKey: ['holidays', business.id] });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('availability.holidays')}</CardTitle>
        <CardDescription>{t('availability.holidaysHint')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t('availability.date')} htmlFor="h-date" error={errors.date?.message}>
            <Input type="date" {...register('date')} />
          </Field>
          <Field
            label={t('availability.holidayName')}
            htmlFor="h-name"
            error={errors.name?.message}
          >
            <Input {...register('name')} />
          </Field>
          {(units.data?.length ?? 0) > 1 && (
            <Field label={t('availability.unit')} htmlFor="h-unit" className="sm:col-span-2">
              <NativeSelect {...register('unit_id', { setValueAs: (v: string) => v || null })}>
                <option value="">{t('availability.allUnits')}</option>
                {units.data!.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          )}
          <div className="sm:col-span-2">
            <Button type="submit" variant="secondary" loading={isSubmitting}>
              <Plus aria-hidden /> {t('availability.addHoliday')}
            </Button>
          </div>
        </form>
        <ul className="space-y-2">
          {(list.data ?? []).map((h) => (
            <li
              key={h.id}
              className="flex items-center justify-between rounded-lg border p-3 text-sm"
            >
              <span>
                <span className="font-medium tabular-nums">
                  {h.date.split('-').reverse().join('/')}
                </span>{' '}
                · {h.name}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => void remove(h.id)}
                aria-label={t('common.delete')}
              >
                <Trash2 aria-hidden />
              </Button>
            </li>
          ))}
          {list.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">{t('availability.noHolidays')}</p>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
