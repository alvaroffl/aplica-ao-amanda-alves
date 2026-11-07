import { newPasswordSchema, passwordResetRequestSchema } from '@agendae/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { publicUrl } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { AuthLayout } from './AuthLayout';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [sent, setSent] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof passwordResetRequestSchema>>({ resolver: zodResolver(passwordResetRequestSchema) });

  const onSubmit = handleSubmit(async ({ email }) => {
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: publicUrl('/redefinir-senha') });
    setSent(true); // não revela se o e-mail existe
  });

  return (
    <AuthLayout title={t('auth.forgotTitle')} description={t('auth.forgotText')} footer={<Link to="/entrar" className="text-primary hover:underline">{t('common.back')}</Link>}>
      {sent ? (
        <p role="status" className="rounded-lg bg-success/10 p-4 text-sm">
          {t('auth.resetSent')}
        </p>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <Field label={t('auth.email')} htmlFor="email" error={errors.email?.message}>
            <Input type="email" autoComplete="email" {...register('email')} />
          </Field>
          <Button type="submit" className="w-full" loading={isSubmitting}>
            {t('auth.sendLink')}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof newPasswordSchema>>({ resolver: zodResolver(newPasswordSchema) });

  const onSubmit = handleSubmit(async ({ password }) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(t('auth.resetExpired'));
      return;
    }
    toast.success(t('auth.passwordUpdated'));
    navigate('/painel', { replace: true });
  });

  return (
    <AuthLayout title={t('auth.resetTitle')}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label={t('auth.newPassword')} htmlFor="password" error={errors.password?.message}>
          <Input type="password" autoComplete="new-password" {...register('password')} />
        </Field>
        <Field label={t('auth.confirmPassword')} htmlFor="confirm" error={errors.confirm?.message}>
          <Input type="password" autoComplete="new-password" {...register('confirm')} />
        </Field>
        <Button type="submit" className="w-full" loading={isSubmitting}>
          {t('auth.updatePassword')}
        </Button>
      </form>
    </AuthLayout>
  );
}
