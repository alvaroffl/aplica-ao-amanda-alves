import { signInSchema } from '@agendae/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { publicUrl } from '@/lib/env';
import { useAuth } from '@/providers/auth';
import { AuthLayout } from './AuthLayout';

type Form = z.input<typeof signInSchema>;

export function SignInPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/painel';
  const [magicSent, setMagicSent] = React.useState(false);
  const [magicLoading, setMagicLoading] = React.useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(signInSchema), defaultValues: { email: '', password: '' } });

  if (user) return <Navigate to={from} replace />;

  const onSubmit = handleSubmit(async (values) => {
    const { error } = await supabase.auth.signInWithPassword({ email: values.email, password: values.password });
    if (error) {
      toast.error(t('auth.invalidCredentials'));
      return;
    }
    navigate(from, { replace: true });
  });

  const sendMagicLink = async () => {
    if (!(await trigger('email'))) return;
    setMagicLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: getValues('email'),
      options: { shouldCreateUser: false, emailRedirectTo: publicUrl('/painel') },
    });
    setMagicLoading(false);
    if (error) toast.error(t('errors.INTERNAL_ERROR'));
    else setMagicSent(true);
  };

  return (
    <AuthLayout
      title={t('auth.signInTitle')}
      description={t('auth.signInText')}
      footer={
        <>
          {t('auth.noAccount')}{' '}
          <Link to="/cadastro" className="font-medium text-primary hover:underline">
            {t('auth.signUp')}
          </Link>
        </>
      }
    >
      {magicSent ? (
        <p role="status" className="rounded-lg bg-success/10 p-4 text-sm">
          {t('auth.magicSent', { email: getValues('email') })}
        </p>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <Field label={t('auth.email')} htmlFor="email" error={errors.email?.message}>
            <Input type="email" autoComplete="email" inputMode="email" {...register('email')} />
          </Field>
          <Field label={t('auth.password')} htmlFor="password" error={errors.password?.message}>
            <Input type="password" autoComplete="current-password" {...register('password')} />
          </Field>
          <div className="flex justify-end">
            <Link to="/recuperar-senha" className="text-sm text-primary hover:underline">
              {t('auth.forgot')}
            </Link>
          </div>
          <Button type="submit" className="w-full" loading={isSubmitting}>
            {t('auth.signIn')}
          </Button>
          <div className="relative text-center text-xs text-muted-foreground before:absolute before:inset-x-0 before:top-1/2 before:h-px before:bg-border">
            <span className="relative bg-card px-2">{t('auth.or')}</span>
          </div>
          <Button type="button" variant="outline" className="w-full" onClick={sendMagicLink} loading={magicLoading}>
            {t('auth.magicLink')}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
