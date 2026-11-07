import { signUpSchema } from '@agendae/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { publicUrl } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth';
import { AuthLayout } from './AuthLayout';

type Form = z.input<typeof signUpSchema>;

export function SignUpPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [checkEmail, setCheckEmail] = React.useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: '', email: params.get('email') ?? '', password: '' },
  });

  if (user) return <Navigate to="/painel" replace />;

  const onSubmit = handleSubmit(async (values) => {
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { full_name: values.fullName }, emailRedirectTo: publicUrl('/painel') },
    });
    if (error) {
      toast.error(
        error.message.includes('registered')
          ? t('auth.alreadyRegistered')
          : t('errors.INTERNAL_ERROR'),
      );
      return;
    }
    if (data.session) navigate('/painel', { replace: true });
    else setCheckEmail(true);
  });

  return (
    <AuthLayout
      title={t('auth.signUpTitle')}
      description={t('auth.signUpText')}
      footer={
        <>
          {t('auth.haveAccount')}{' '}
          <Link to="/entrar" className="font-medium text-primary hover:underline">
            {t('auth.signIn')}
          </Link>
        </>
      }
    >
      {checkEmail ? (
        <p role="status" className="rounded-lg bg-success/10 p-4 text-sm">
          {t('auth.checkEmail', { email: getValues('email') })}
        </p>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <Field label={t('auth.fullName')} htmlFor="fullName" error={errors.fullName?.message}>
            <Input autoComplete="name" {...register('fullName')} />
          </Field>
          <Field label={t('auth.email')} htmlFor="email" error={errors.email?.message}>
            <Input type="email" autoComplete="email" inputMode="email" {...register('email')} />
          </Field>
          <Field
            label={t('auth.password')}
            htmlFor="password"
            error={errors.password?.message}
            hint={t('auth.passwordHint')}
          >
            <Input type="password" autoComplete="new-password" {...register('password')} />
          </Field>
          <p className="text-xs text-muted-foreground">{t('auth.terms')}</p>
          <Button type="submit" className="w-full" loading={isSubmitting}>
            {t('auth.createAccount')}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
