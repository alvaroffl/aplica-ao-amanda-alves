import { businessSettingsSchema } from '@agendae/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { ImageUp } from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { z } from 'zod';
import { PageHeader } from '@/components/common/States';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input, NativeSelect, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toApiError, unwrap } from '@/lib/api';
import { publicUrl } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { initials } from '@/lib/utils';
import { useBusiness } from '../business';
import { TIMEZONES } from '../timezones';

type Form = z.input<typeof businessSettingsSchema>;

export function SettingsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { business } = useBusiness();
  const [uploading, setUploading] = React.useState(false);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Form, unknown, z.output<typeof businessSettingsSchema>>({ resolver: zodResolver(businessSettingsSchema) });

  React.useEffect(() => {
    reset({
      name: business.name,
      slug: business.slug,
      description: business.description ?? '',
      phone: business.phone ?? '',
      email: business.email ?? '',
      timezone: business.timezone,
      slot_interval_min: business.slot_interval_min,
      cancellation_window_hours: business.cancellation_window_hours,
      booking_hold_min: business.booking_hold_min,
      reminder_24h: business.reminder_24h,
      reminder_2h: business.reminder_2h,
      whatsapp_enabled: business.whatsapp_enabled,
    });
  }, [business, reset]);

  const slug = watch('slug');

  const onSubmit = handleSubmit(async (v) => {
    try {
      unwrap(await supabase.from('businesses').update({ ...v, description: v.description || null }).eq('id', business.id));
      await qc.invalidateQueries({ queryKey: ['memberships'] });
      toast.success(t('common.saved'));
    } catch (e) {
      toast.error(t(`errors.${toApiError(e).code}`, { defaultValue: t('errors.INTERNAL_ERROR') }));
    }
  });

  const uploadLogo = async (file: File) => {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      toast.error(t('settings.logoInvalid'));
      return;
    }
    setUploading(true);
    try {
      const ext = file.type.split('/')[1];
      const path = `${business.id}/logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('logos').upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from('logos').getPublicUrl(path);
      unwrap(await supabase.from('businesses').update({ logo_url: data.publicUrl }).eq('id', business.id));
      await qc.invalidateQueries({ queryKey: ['memberships'] });
      toast.success(t('settings.logoUpdated'));
    } catch (e) {
      toast.error(t(`errors.${toApiError(e).code}`, { defaultValue: t('errors.INTERNAL_ERROR') }));
    } finally {
      setUploading(false);
    }
  };

  const Toggle = ({ name, label, hint }: { name: 'reminder_24h' | 'reminder_2h' | 'whatsapp_enabled'; label: string; hint: string }) => (
    <label className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm">
      <span>
        <span className="block font-medium">{label}</span>
        <span className="text-muted-foreground">{hint}</span>
      </span>
      <Switch checked={watch(name)} onCheckedChange={(v) => setValue(name, v, { shouldDirty: true })} />
    </label>
  );

  return (
    <div className="max-w-3xl">
      <PageHeader title={t('settings.title')} description={t('settings.subtitle')} />
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.general')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {business.logo_url ? (
                <img src={business.logo_url} alt={t('settings.logo')} className="size-16 rounded-xl object-cover" />
              ) : (
                <span className="flex size-16 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground" aria-hidden>
                  {initials(business.name)}
                </span>
              )}
              <label className="inline-flex">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(e) => e.target.files?.[0] && void uploadLogo(e.target.files[0])}
                />
                <span className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border bg-card px-3 text-sm font-medium hover:bg-accent has-[:focus-visible]:outline-2">
                  <ImageUp className="size-4" aria-hidden /> {uploading ? t('common.loading') : t('settings.uploadLogo')}
                </span>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('onboarding.name')} htmlFor="name" error={errors.name?.message}>
                <Input {...register('name')} />
              </Field>
              <Field label={t('onboarding.slug')} htmlFor="slug" error={errors.slug?.message} hint={publicUrl(`/${slug ?? ''}`)}>
                <Input autoCapitalize="none" {...register('slug')} />
              </Field>
              <Field label={t('settings.description')} htmlFor="description" error={errors.description?.message} className="sm:col-span-2">
                <Textarea rows={3} {...register('description')} />
              </Field>
              <Field label={t('settings.phone')} htmlFor="phone" error={errors.phone?.message}>
                <Input type="tel" {...register('phone')} />
              </Field>
              <Field label={t('settings.email')} htmlFor="email" error={errors.email?.message}>
                <Input type="email" {...register('email')} />
              </Field>
              <Field label={t('onboarding.timezone')} htmlFor="timezone" className="sm:col-span-2">
                <NativeSelect {...register('timezone')}>
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('settings.policies')}</CardTitle>
            <CardDescription>{t('settings.policiesHint')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <Field label={t('settings.slotInterval')} htmlFor="slot_interval_min" error={errors.slot_interval_min?.message} hint={t('settings.slotIntervalHint')}>
              <NativeSelect {...register('slot_interval_min')}>
                {[10, 15, 20, 30, 45, 60].map((m) => (
                  <option key={m} value={m}>
                    {m} min
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label={t('settings.cancellationWindow')} htmlFor="cancellation_window_hours" error={errors.cancellation_window_hours?.message} hint={t('settings.cancellationWindowHint')}>
              <Input type="number" min={0} max={720} {...register('cancellation_window_hours')} />
            </Field>
            <Field label={t('settings.hold')} htmlFor="booking_hold_min" error={errors.booking_hold_min?.message} hint={t('settings.holdHint')}>
              <Input type="number" min={5} max={120} {...register('booking_hold_min')} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('settings.notifications')}</CardTitle>
            <CardDescription>{t('settings.notificationsHint')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Toggle name="reminder_24h" label={t('settings.reminder24h')} hint={t('settings.reminder24hHint')} />
            <Toggle name="reminder_2h" label={t('settings.reminder2h')} hint={t('settings.reminder2hHint')} />
            <Toggle name="whatsapp_enabled" label={t('settings.whatsapp')} hint={t('settings.whatsappHint')} />
          </CardContent>
        </Card>

        <div className="sticky bottom-4 flex justify-end">
          <Button type="submit" size="lg" loading={isSubmitting} disabled={!isDirty} className="shadow-lg">
            {t('common.saveChanges')}
          </Button>
        </div>
      </form>
    </div>
  );
}
