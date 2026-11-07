import { formatMoney } from '@agendae/shared/money';
import type { PublicBooking } from '@agendae/shared';
import { useQueryClient } from '@tanstack/react-query';
import { Copy, CreditCard, FlaskConical, Timer } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { QrCode } from '@/components/common/QrCode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { copyText } from '@/lib/utils';
import { simulatePayment } from '../public/api';

function useCountdown(until: string | null) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  if (!until) return null;
  const ms = Math.max(0, Date.parse(until) - now);
  const m = Math.floor(ms / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return { ms, label: `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` };
}

export function PaymentPanel({
  booking,
  currency = 'BRL',
}: {
  booking: PublicBooking;
  currency?: string;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const payment = booking.payment;
  const countdown = useCountdown(booking.hold_expires_at);
  const [simulating, setSimulating] = React.useState(false);

  const copy = async () => {
    if (!payment?.pix_qr_code) return;
    try {
      await copyText(payment.pix_qr_code);
      toast.success(t('common.copied'));
    } catch {
      toast.error(t('errors.INTERNAL_ERROR'));
    }
  };

  const simulate = async () => {
    if (!payment) return;
    setSimulating(true);
    try {
      await simulatePayment(payment.id);
      await qc.invalidateQueries({ queryKey: ['booking-token'] });
    } catch {
      toast.error(t('errors.INTERNAL_ERROR'));
    } finally {
      setSimulating(false);
    }
  };

  return (
    <Card className="border-primary/40">
      <CardHeader>
        <CardTitle>{t('payment.title')}</CardTitle>
        <CardDescription>
          {t('payment.subtitle', { amount: formatMoney(booking.deposit_cents, currency) })}
        </CardDescription>
        {countdown && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-warning" aria-live="off">
            <Timer className="size-4" aria-hidden />
            {t('payment.expiresIn', { time: countdown.label })}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!payment ? (
          <p className="text-sm text-muted-foreground">{t('payment.unavailable')}</p>
        ) : payment.method === 'pix' && payment.pix_qr_code ? (
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {payment.pix_qr_code_base64 ? (
              <img
                src={`data:image/png;base64,${payment.pix_qr_code_base64}`}
                alt={t('payment.qrAlt')}
                width={200}
                height={200}
                className="rounded-lg bg-white p-2"
              />
            ) : (
              <QrCode value={payment.pix_qr_code} label={t('payment.qrAlt')} size={200} />
            )}
            <div className="w-full min-w-0 space-y-3">
              <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                <li>{t('payment.pixStep1')}</li>
                <li>{t('payment.pixStep2')}</li>
                <li>{t('payment.pixStep3')}</li>
              </ol>
              <div className="rounded-lg border bg-muted/50 p-2">
                <p className="break-all font-mono text-xs leading-relaxed">{payment.pix_qr_code}</p>
              </div>
              <Button onClick={copy} className="w-full">
                <Copy aria-hidden /> {t('payment.copyCode')}
              </Button>
            </div>
          </div>
        ) : payment.checkout_url ? (
          <Button asChild size="lg" className="w-full">
            <a href={payment.checkout_url}>
              <CreditCard aria-hidden /> {t('payment.cardButton')}
            </a>
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">{t('payment.cardFake')}</p>
        )}

        <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <span className="size-2 animate-pulse rounded-full bg-warning" aria-hidden />
          {t('payment.waiting')}
        </p>

        {payment?.provider === 'fake' && (
          <Button variant="secondary" onClick={simulate} loading={simulating} className="w-full">
            <FlaskConical aria-hidden /> {t('payment.simulate')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
