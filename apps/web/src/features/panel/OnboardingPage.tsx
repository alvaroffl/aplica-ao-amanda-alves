import { onboardingSchema, slugify } from '@agendae/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/field';
import { Input, NativeSelect } from '@/components/ui/input';
import { toApiError } from '@/lib/api';
import { publicUrl } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth';
import { AuthLayout } from '../auth/AuthLayout';
import { TIMEZONES } from './timezones';

type Form = z.input<typeof onboardingSchema>;

export function OnboardingPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getFieldState,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { name: '', slug: '', timezone: 'America/Sao_Paulo', ownerIsProfessional: true },
  });
  const slug = watch('slug');
  const owner = watch('ownerIsProfessional');

  const onSubmit = handleSubmit(async (values) => {
    try {
      const { data, error } = await supabase.rpc('create_business', {
        p_name: values.name,
        p_slug: values.slug,
        p_timezone: values.timezone,
        p_owner_is_professional: values.ownerIsProfessional ?? true,
        p_owner_name: (user?.user_metadata?.full_name as string | undefined) ?? '',
      });
      if (error) throw error;
      localStorage.setItem('agendae-business', data as string);
      await qc.invalidateQueries({ queryKey: ['memberships'] });
      toast.success(t('onboarding.created'));
      navigate('/painel/servicos?primeiro=1', { replace: true });
    } catch (e) {
      const err = toApiError(e);
      toast.error(t(`errors.${err.code}`, { defaultValue: t('errors.INTERNAL_ERROR') }));
    }
  });

  return (
    <AuthLayout
      title={t('onboarding.title')}
      description={t('onboarding.subtitle')}
      footer={
        <Link to="/painel" className="text-primary hover:underline">
          {t('common.back')}
        </Link>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label={t('onboarding.name')} htmlFor="name" error={errors.name?.message}>
          <Input
            autoComplete="organization"
            {...register('name', {
              onChange: (e) => {
                if (!getFieldState('slug').isDirty) setValue('slug', slugify(e.target.value));
              },
            })}
          />
        </Field>
        <Field
          label={t('onboarding.slug')}
          htmlFor="slug"
          error={errors.slug?.message}
          hint={t('onboarding.slugHint', { url: publicUrl(`/${slug || '...'}`) })}
        >
          <Input
            autoCapitalize="none"
            spellCheck={false}
            {...register('slug', { setValueAs: (v: string) => slugify(v) })}
          />
        </Field>
        <Field label={t('onboarding.timezone')} htmlFor="timezone" error={errors.timezone?.message}>
          <NativeSelect {...register('timezone')}>
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <div className="flex items-start gap-3">
          <Checkbox
            id="owner"
            checked={owner}
            onCheckedChange={(v) => setValue('ownerIsProfessional', v === true)}
          />
          <label htmlFor="owner" className="text-sm leading-snug">
            {t('onboarding.ownerIsProfessional')}
          </label>
        </div>
        <Button type="submit" className="w-full" loading={isSubmitting}>
          {t('onboarding.create')}
        </Button>
      </form>
    </AuthLayout>
  );
}
