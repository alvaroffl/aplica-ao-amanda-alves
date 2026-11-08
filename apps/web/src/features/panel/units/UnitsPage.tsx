import { formatPhone, slugify, unitSchema } from '@agendae/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { MapPin, Pencil, Plus } from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { z } from 'zod';
import { ErrorState, PageHeader } from '@/components/common/States';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input, NativeSelect } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { publicUrl } from '@/lib/env';
import { toApiError, unwrap } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useBusiness } from '../business';
import { keys, useUnits, type Unit } from '../data';
import { TIMEZONES } from '../timezones';

type Form = z.input<typeof unitSchema>;

export function UnitsPage() {
  const { t } = useTranslation();
  const { business } = useBusiness();
  const units = useUnits();
  const [editing, setEditing] = React.useState<Unit | 'new' | null>(null);
  return (
    <div>
      <PageHeader
        title={t('units.title')}
        description={t('units.subtitle')}
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus aria-hidden /> {t('units.new')}
          </Button>
        }
      />
      {units.isPending ? (
        <Skeleton className="h-32" />
      ) : units.isError ? (
        <ErrorState error={units.error} onRetry={() => void units.refetch()} />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {units.data.map((u) => (
            <Card key={u.id} className="flex items-start gap-3 p-4">
              <MapPin className="mt-0.5 size-5 text-primary" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {u.name} {!u.active && <Badge variant="secondary">{t('common.inactive')}</Badge>}
                </p>
                {u.address && <p className="text-sm text-muted-foreground">{u.address}</p>}
                {u.phone && <p className="text-sm text-muted-foreground">{formatPhone(u.phone)}</p>}
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {publicUrl(`/${business.slug}/${u.slug}`)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditing(u)}
                aria-label={`${t('common.edit')} ${u.name}`}
              >
                <Pencil aria-hidden />
              </Button>
            </Card>
          ))}
        </div>
      )}
      <UnitDialog editing={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function UnitDialog({ editing, onClose }: { editing: Unit | 'new' | null; onClose: () => void }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { business } = useBusiness();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    getFieldState,
    formState: { errors, isSubmitting },
  } = useForm<Form, unknown, z.output<typeof unitSchema>>({ resolver: zodResolver(unitSchema) });

  React.useEffect(() => {
    if (!editing) return;
    const u = editing === 'new' ? null : editing;
    reset({
      name: u?.name ?? '',
      slug: u?.slug ?? '',
      address: u?.address ?? '',
      phone: u?.phone ?? '',
      timezone: u?.timezone ?? business.timezone,
      active: u?.active ?? true,
    });
  }, [editing, reset, business.timezone]);
  const active = watch('active');

  const onSubmit = handleSubmit(async (v) => {
    try {
      const payload = { ...v, address: v.address || null, business_id: business.id };
      if (editing === 'new') unwrap(await supabase.from('units').insert(payload));
      else
        unwrap(
          await supabase
            .from('units')
            .update(payload)
            .eq('id', (editing as Unit).id),
        );
      await qc.invalidateQueries({ queryKey: keys.units(business.id) });
      toast.success(t('common.saved'));
      onClose();
    } catch (e) {
      toast.error(t(`errors.${toApiError(e).code}`));
    }
  });

  return (
    <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing === 'new' ? t('units.new') : t('units.edit')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <Field label={t('units.name')} htmlFor="u-name" error={errors.name?.message}>
            <Input
              {...register('name', {
                onChange: (e) => {
                  if (editing === 'new' && !getFieldState('slug').isDirty)
                    setValue('slug', slugify(e.target.value));
                },
              })}
            />
          </Field>
          <Field label={t('units.slug')} htmlFor="u-slug" error={errors.slug?.message}>
            <Input {...register('slug')} />
          </Field>
          <Field label={t('units.address')} htmlFor="u-address" error={errors.address?.message}>
            <Input autoComplete="street-address" {...register('address')} />
          </Field>
          <Field label={t('units.phone')} htmlFor="u-phone" error={errors.phone?.message}>
            <Input type="tel" {...register('phone')} />
          </Field>
          <Field label={t('onboarding.timezone')} htmlFor="u-tz">
            <NativeSelect {...register('timezone')}>
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <label className="flex items-center justify-between rounded-lg border p-3 text-sm">
            <span className="font-medium">{t('units.active')}</span>
            <Switch checked={active} onCheckedChange={(v) => setValue('active', v)} />
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
