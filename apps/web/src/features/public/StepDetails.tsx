import { formatMoney } from '@agendae/shared/money';
import type { BookingPolicy, ClientDetails, ClientDetailsInput } from '@agendae/shared';
import { clientDetailsSchema } from '@agendae/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreditCard, QrCode, ShieldCheck } from 'lucide-react';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { TestModeNotice } from '@/components/common/TestModeNotice';
import { Turnstile, captchaEnabled, type TurnstileHandle } from '@/components/common/Turnstile';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/field';
import { Input, Textarea } from '@/components/ui/input';
import { env } from '@/lib/env';
import { cn } from '@/lib/utils';
import { policySummary } from './policy';

export interface DetailsSubmit {
  client: ClientDetails;
  captchaToken: string;
  paymentMethod: 'pix' | 'card';
}

export function StepDetails({
  depositCents,
  priceCents,
  currency,
  policy,
  paymentMethods = ['pix', 'card'],
  maxInstallments = 1,
  submitting,
  onSubmit,
  captchaRef,
}: {
  depositCents: number;
  priceCents: number;
  currency: string;
  policy: BookingPolicy;
  paymentMethods?: ('pix' | 'card')[];
  maxInstallments?: number;
  submitting: boolean;
  onSubmit: (data: DetailsSubmit) => void;
  captchaRef: React.RefObject<TurnstileHandle | null>;
}) {
  const { t, i18n } = useTranslation();
  const [captchaToken, setCaptchaToken] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState<'pix' | 'card'>(
    paymentMethods[0] ?? 'pix',
  );
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientDetailsInput, unknown, ClientDetails>({
    resolver: zodResolver(clientDetailsSchema),
    defaultValues: { name: '', email: '', phone: '', notes: '', consent: false as unknown as true },
    mode: 'onTouched',
  });

  const needsCaptcha = captchaEnabled();
  const submit = handleSubmit((client) => onSubmit({ client, captchaToken, paymentMethod }));

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label={t('booking.name')}
          htmlFor="name"
          error={errors.name?.message}
          className="sm:col-span-2"
        >
          <Input autoComplete="name" autoCapitalize="words" {...register('name')} />
        </Field>
        <Field
          label={t('booking.email')}
          htmlFor="email"
          error={errors.email?.message}
          hint={t('booking.emailHint')}
        >
          <Input type="email" inputMode="email" autoComplete="email" {...register('email')} />
        </Field>
        <Field
          label={t('booking.phone')}
          htmlFor="phone"
          error={errors.phone?.message}
          hint={t('booking.phoneHint')}
        >
          <Input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(11) 98765-4321"
            {...register('phone')}
          />
        </Field>
        <Field
          label={`${t('booking.notes')} (${t('common.optional')})`}
          htmlFor="notes"
          error={errors.notes?.message}
          className="sm:col-span-2"
        >
          <Textarea rows={2} placeholder={t('booking.notesPlaceholder')} {...register('notes')} />
        </Field>
      </div>

      {depositCents > 0 && (
        <fieldset className="space-y-3 rounded-xl border bg-accent/40 p-4">
          <legend className="sr-only">{t('booking.payWith')}</legend>
          <p className="text-sm">
            {t('booking.depositText', { amount: formatMoney(depositCents, currency) })}
          </p>
          <div className={cn('grid gap-2', paymentMethods.length > 1 && 'grid-cols-2')}>
            {paymentMethods.map((m) => (
              <label
                key={m}
                className={cn(
                  'flex cursor-pointer items-center justify-center gap-2 rounded-lg border bg-card px-3 py-3 text-sm font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring',
                  paymentMethod === m && 'border-primary ring-1 ring-primary',
                )}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={m}
                  checked={paymentMethod === m}
                  onChange={() => setPaymentMethod(m)}
                  className="sr-only"
                />
                {m === 'pix' ? (
                  <QrCode className="size-4" aria-hidden />
                ) : (
                  <CreditCard className="size-4" aria-hidden />
                )}
                {t(`booking.${m}`)}
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {paymentMethod === 'pix'
              ? t('booking.pixHint')
              : maxInstallments > 1
                ? t('booking.cardHintInstallments', { n: maxInstallments })
                : t('booking.cardHint')}
          </p>
          {env.paymentsTestMode && <TestModeNotice />}
        </fieldset>
      )}

      {priceCents === 0 && (
        <p className="rounded-lg bg-accent/40 p-3 text-sm">{t('booking.freeEvaluation')}</p>
      )}

      {(() => {
        const text = policySummary(t, policy, depositCents > 0);
        return text ? (
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
            {text}
          </p>
        ) : null;
      })()}

      <div className="space-y-1.5">
        <div className="flex items-start gap-3">
          <Controller
            control={control}
            name="consent"
            render={({ field }) => (
              <Checkbox
                id="consent"
                checked={field.value === true}
                onCheckedChange={(v) => field.onChange(v === true)}
                onBlur={field.onBlur}
                aria-invalid={errors.consent ? true : undefined}
                aria-describedby={errors.consent ? 'consent-error' : undefined}
                className="mt-0.5"
              />
            )}
          />
          <label htmlFor="consent" className="text-sm leading-snug">
            {/* o texto do link vem da tradução: <privacy>…</privacy> */}
            <Trans i18nKey="booking.consent" components={{ privacy: <PrivacyLink /> }} />
          </label>
        </div>
        {errors.consent && (
          <p id="consent-error" role="alert" className="text-xs font-medium text-destructive">
            {t(errors.consent.message ?? 'validation.consent')}
          </p>
        )}
      </div>

      <Turnstile
        ref={captchaRef}
        onToken={setCaptchaToken}
        language={i18n.language.toLowerCase()}
      />

      <Button
        type="submit"
        size="lg"
        className="w-full"
        loading={submitting}
        disabled={needsCaptcha && !captchaToken}
      >
        {submitting
          ? t('booking.confirming')
          : depositCents > 0
            ? t('booking.confirmAndPay', { amount: formatMoney(depositCents, currency) })
            : t('booking.confirm')}
      </Button>
    </form>
  );
}

function PrivacyLink({ children }: { children?: React.ReactNode }) {
  return (
    <a
      href="/privacidade"
      target="_blank"
      rel="noreferrer"
      className="font-medium text-primary underline-offset-2 hover:underline"
    >
      {children}
    </a>
  );
}
