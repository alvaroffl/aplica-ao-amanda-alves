import {
  computeDeposit,
  formatDuration,
  formatMoney,
  serviceSchema,
  type ServiceFormInput,
  type ServiceFormOutput,
} from '@agendae/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Scissors } from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { EmptyState, ErrorState, PageHeader } from '@/components/common/States';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input, NativeSelect, Textarea } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { toApiError, unwrap } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useBusiness } from '../business';
import { keys, useProfessionals, useServices, type Service } from '../data';

export function ServicesPage() {
  const { t } = useTranslation();
  const { business } = useBusiness();
  const [params] = useSearchParams();
  const services = useServices();
  const [editing, setEditing] = React.useState<Service | 'new' | null>(null);
  const first = params.get('primeiro') === '1';

  return (
    <div>
      <PageHeader
        title={t('services.title')}
        description={first ? t('services.firstHint') : t('services.subtitle')}
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus aria-hidden /> {t('services.new')}
          </Button>
        }
      />
      {services.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : services.isError ? (
        <ErrorState error={services.error} onRetry={() => void services.refetch()} />
      ) : services.data.length === 0 ? (
        <EmptyState
          icon={<Scissors />}
          title={t('services.empty')}
          description={t('services.emptyHint')}
          action={<Button onClick={() => setEditing('new')}>{t('services.new')}</Button>}
        />
      ) : (
        <Card className="divide-y">
          {services.data.map((s) => (
            <div key={s.id} className="flex items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{s.name}</p>
                  {!s.active && <Badge variant="secondary">{t('common.inactive')}</Badge>}
                  {s.deposit_type !== 'none' && (
                    <Badge variant="outline">
                      {t('services.depositBadge', {
                        amount: formatMoney(computeDeposit(s.price_cents, s.deposit_type, s.deposit_value), business.currency),
                      })}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDuration(s.duration_min)}
                  {s.buffer_after_min > 0 && ` · ${t('services.bufferShort', { min: s.buffer_after_min })}`}
                  {` · ${t('services.prosCount', { count: s.professional_ids.length })}`}
                </p>
              </div>
              <span className="font-semibold tabular-nums">{formatMoney(s.price_cents, business.currency)}</span>
              <Button variant="ghost" size="icon" onClick={() => setEditing(s)} aria-label={`${t('common.edit')} ${s.name}`}>
                <Pencil aria-hidden />
              </Button>
            </div>
          ))}
        </Card>
      )}
      <ServiceDialog editing={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function ServiceDialog({ editing, onClose }: { editing: Service | 'new' | null; onClose: () => void }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { business } = useBusiness();
  const professionals = useProfessionals();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormInput, unknown, ServiceFormOutput>({ resolver: zodResolver(serviceSchema) });

  React.useEffect(() => {
    if (!editing) return;
    const s = editing === 'new' ? null : editing;
    reset({
      name: s?.name ?? '',
      description: s?.description ?? '',
      category: s?.category ?? '',
      duration_min: s?.duration_min ?? 60,
      price: s ? (s.price_cents / 100).toFixed(2).replace('.', ',') : '',
      buffer_before_min: s?.buffer_before_min ?? 0,
      buffer_after_min: s?.buffer_after_min ?? 0,
      min_notice_min: s?.min_notice_min ?? 60,
      max_advance_days: s?.max_advance_days ?? 60,
      deposit_type: s?.deposit_type ?? 'none',
      deposit_value: s
        ? s.deposit_type === 'fixed'
          ? (s.deposit_value / 100).toFixed(2).replace('.', ',')
          : String(s.deposit_value)
        : '',
      active: s?.active ?? true,
      professional_ids: s?.professional_ids ?? (professionals.data ?? []).filter((p) => p.active).map((p) => p.id),
    });
  }, [editing, reset, professionals.data]);

  const depositType = watch('deposit_type');
  const selectedPros = watch('professional_ids') ?? [];
  const active = watch('active');

  const onSubmit = handleSubmit(async ({ professional_ids, ...values }) => {
    try {
      const payload = { ...values, description: values.description || null, category: values.category || null, business_id: business.id };
      const id =
        editing === 'new'
          ? unwrap(await supabase.from('services').insert(payload).select('id').single()).id
          : (unwrap(await supabase.from('services').update(payload).eq('id', (editing as Service).id).select('id').single()).id);
      // sincroniza quem atende o serviço
      unwrap(await supabase.from('service_professionals').delete().eq('service_id', id));
      if (professional_ids.length) {
        unwrap(
          await supabase
            .from('service_professionals')
            .insert(professional_ids.map((pid) => ({ business_id: business.id, service_id: id, professional_id: pid }))),
        );
      }
      await qc.invalidateQueries({ queryKey: keys.services(business.id) });
      await qc.invalidateQueries({ queryKey: keys.professionals(business.id) });
      toast.success(t('common.saved'));
      onClose();
    } catch (e) {
      toast.error(t(`errors.${toApiError(e).code}`));
    }
  });

  return (
    <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing === 'new' ? t('services.new') : t('services.edit')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('services.name')} htmlFor="name" error={errors.name?.message}>
              <Input {...register('name')} />
            </Field>
            <Field label={t('services.category')} htmlFor="category" error={errors.category?.message} hint={t('services.categoryHint')}>
              <Input {...register('category')} />
            </Field>
            <Field label={t('services.description')} htmlFor="description" error={errors.description?.message} className="sm:col-span-2">
              <Textarea rows={2} {...register('description')} />
            </Field>
            <Field label={t('services.duration')} htmlFor="duration_min" error={errors.duration_min?.message}>
              <Input type="number" inputMode="numeric" min={5} step={5} {...register('duration_min')} />
            </Field>
            <Field label={t('services.price')} htmlFor="price" error={errors.price?.message}>
              <Input inputMode="decimal" placeholder="0,00" {...register('price')} />
            </Field>
          </div>

          <details className="rounded-lg border p-3" open={editing !== 'new'}>
            <summary className="cursor-pointer text-sm font-medium">{t('services.rules')}</summary>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field label={t('services.bufferBefore')} htmlFor="buffer_before_min" error={errors.buffer_before_min?.message} hint={t('services.bufferHint')}>
                <Input type="number" min={0} step={5} {...register('buffer_before_min')} />
              </Field>
              <Field label={t('services.bufferAfter')} htmlFor="buffer_after_min" error={errors.buffer_after_min?.message}>
                <Input type="number" min={0} step={5} {...register('buffer_after_min')} />
              </Field>
              <Field label={t('services.minNotice')} htmlFor="min_notice_min" error={errors.min_notice_min?.message} hint={t('services.minNoticeHint')}>
                <Input type="number" min={0} step={15} {...register('min_notice_min')} />
              </Field>
              <Field label={t('services.maxAdvance')} htmlFor="max_advance_days" error={errors.max_advance_days?.message}>
                <Input type="number" min={1} max={365} {...register('max_advance_days')} />
              </Field>
            </div>
          </details>

          <fieldset className="grid gap-4 rounded-lg border p-3 sm:grid-cols-2">
            <legend className="px-1 text-sm font-medium">{t('services.deposit')}</legend>
            <Field label={t('services.depositType')} htmlFor="deposit_type">
              <NativeSelect {...register('deposit_type')}>
                <option value="none">{t('services.depositNone')}</option>
                <option value="percent">{t('services.depositPercent')}</option>
                <option value="fixed">{t('services.depositFixed')}</option>
              </NativeSelect>
            </Field>
            {depositType !== 'none' && (
              <Field
                label={depositType === 'percent' ? t('services.depositPercentValue') : t('services.depositFixedValue')}
                htmlFor="deposit_value"
                error={errors.deposit_value?.message}
              >
                <Input inputMode="decimal" {...register('deposit_value')} />
              </Field>
            )}
            <p className="text-xs text-muted-foreground sm:col-span-2">{t('services.depositHint')}</p>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">{t('services.professionals')}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {(professionals.data ?? []).map((p) => {
                const checked = selectedPros.includes(p.id);
                return (
                  <label key={p.id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) =>
                        setValue(
                          'professional_ids',
                          v ? [...selectedPros, p.id] : selectedPros.filter((id) => id !== p.id),
                          { shouldDirty: true },
                        )
                      }
                    />
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: p.color }} aria-hidden />
                    {p.name}
                  </label>
                );
              })}
            </div>
            {selectedPros.length === 0 && <p className="text-xs text-warning">{t('services.noProsWarning')}</p>}
          </fieldset>

          <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
            <span>
              <span className="block font-medium">{t('services.active')}</span>
              <span className="text-muted-foreground">{t('services.activeHint')}</span>
            </span>
            <Switch checked={active} onCheckedChange={(v) => setValue('active', v, { shouldDirty: true })} />
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
