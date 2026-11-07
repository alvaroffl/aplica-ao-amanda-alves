import {
  formatDateTime,
  formatDuration,
  formatLongDate,
  formatMoney,
  formatPhone,
  formatTime,
  timeZoneLabel,
} from '@agendae/shared';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarClock, CalendarDays, CheckCircle2, Clock, MapPin, Phone, User, XCircle } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { EmptyState, ErrorState } from '@/components/common/States';
import { BookingStatusBadge, PaymentStatusBadge } from '@/components/common/StatusBadge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api';
import { cancelByToken, useBookingByToken } from '../public/api';
import { PublicLayout } from '../public/PublicLayout';
import { CalendarActions } from './CalendarActions';
import { PaymentPanel } from './PaymentPanel';
import { PrivacyPanel } from './PrivacyPanel';
import { ReschedulePanel } from './ReschedulePanel';

export function ManageBookingPage() {
  const { token } = useParams();
  const [params] = useSearchParams();
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const query = useBookingByToken(token);
  const [rescheduling, setRescheduling] = React.useState(false);
  const [reason, setReason] = React.useState('');
  const [cancelling, setCancelling] = React.useState(false);
  const [deleted, setDeleted] = React.useState(false);
  const isNew = params.get('novo') === '1';

  React.useEffect(() => {
    document.title = t('manage.pageTitle');
  }, [t]);

  if (deleted) {
    return (
      <PublicLayout>
        <EmptyState headingLevel="h1" icon={<CheckCircle2 />} title={t('manage.privacy.deleted')} description={t('manage.privacy.deletedText')} />
      </PublicLayout>
    );
  }

  if (query.isPending) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-2xl space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-48" />
        </div>
      </PublicLayout>
    );
  }

  if (query.isError) {
    const invalid = query.error instanceof ApiError && query.error.code === 'INVALID_TOKEN';
    return (
      <PublicLayout>
        {invalid ? (
          <EmptyState headingLevel="h1" icon={<XCircle />} title={t('manage.invalidLink')} description={t('manage.invalidLinkHint')} />
        ) : (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        )}
      </PublicLayout>
    );
  }

  const b = query.data;
  const tz = b.unit.timezone;
  const policy = b.policy;

  const cancel = async () => {
    setCancelling(true);
    try {
      const result = await cancelByToken(b.manage_token, reason);
      qc.setQueryData(['booking-token', token], { ...result, policy: { ...result.policy, can_cancel: false, can_reschedule: false } });
      await qc.invalidateQueries({ queryKey: ['booking-token', token] });
      toast.success(t('manage.cancelled'));
    } catch (e) {
      const code = e instanceof ApiError ? e.code : 'INTERNAL_ERROR';
      toast.error(t(`errors.${code}`, { defaultValue: t('errors.INTERNAL_ERROR') }));
    } finally {
      setCancelling(false);
    }
  };

  const hero =
    b.status === 'confirmed' && isNew
      ? { icon: <CheckCircle2 className="size-10 text-success" aria-hidden />, title: t('manage.confirmedTitle'), text: b.client.email ? t('manage.confirmedText', { email: b.client.email }) : null }
      : b.status === 'pending_payment'
        ? { icon: <Clock className="size-10 text-warning" aria-hidden />, title: t('manage.pendingTitle'), text: t('manage.pendingText') }
        : b.status === 'cancelled'
          ? { icon: <XCircle className="size-10 text-muted-foreground" aria-hidden />, title: t('manage.cancelledTitle'), text: null }
          : b.status === 'expired'
            ? { icon: <XCircle className="size-10 text-muted-foreground" aria-hidden />, title: t('manage.expiredTitle'), text: t('manage.expiredText') }
            : null;

  return (
    <PublicLayout business={{ name: b.business.name, logo_url: b.business.logo_url, slug: b.business.slug }}>
      <div className="mx-auto max-w-2xl space-y-5">
        {hero && (
          <div className="flex flex-col items-center gap-2 text-center" aria-live="polite">
            {hero.icon}
            <h1 className="text-2xl font-semibold tracking-tight">{hero.title}</h1>
            {hero.text && <p className="max-w-md text-muted-foreground">{hero.text}</p>}
          </div>
        )}
        {!hero && <h1 className="text-2xl font-semibold tracking-tight">{t('manage.title')}</h1>}

        {b.status === 'pending_payment' && <PaymentPanel booking={b} />}

        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-lg">{b.service.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{formatDuration(b.service.duration_min)}</p>
            </div>
            <BookingStatusBadge status={b.status} />
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <Row icon={<CalendarDays />} label={t('booking.when')}>
                <span className="block font-medium first-letter:uppercase">
                  {formatLongDate(b.starts_at, tz)} {t('booking.at')} {formatTime(b.starts_at, tz)}
                </span>
                <span className="block text-xs text-muted-foreground">{timeZoneLabel(tz, i18n.language, new Date(b.starts_at))}</span>
              </Row>
              <Row icon={<User />} label={t('booking.professional')}>
                {b.professional.name}
              </Row>
              <Row icon={<MapPin />} label={t('booking.unit')}>
                {b.unit.name}
                {b.unit.address && (
                  <a
                    className="block text-primary underline-offset-2 hover:underline"
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.unit.address)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {b.unit.address}
                  </a>
                )}
              </Row>
              {b.business.phone && (
                <Row icon={<Phone />} label={t('manage.contact')}>
                  <a className="text-primary underline-offset-2 hover:underline" href={`tel:${b.business.phone}`}>
                    {formatPhone(b.business.phone)}
                  </a>
                </Row>
              )}
            </dl>
            <div className="mt-4 space-y-1 border-t pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('booking.price')}</span>
                <span className="font-medium tabular-nums">{formatMoney(b.price_cents)}</span>
              </div>
              {b.deposit_cents > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('booking.deposit')}</span>
                  <span className="flex items-center gap-2 tabular-nums">
                    {formatMoney(b.deposit_cents)} {b.payment && <PaymentStatusBadge status={b.payment.status} />}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {b.status === 'confirmed' && <CalendarActions booking={b} />}

        {b.status === 'confirmed' && policy && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="size-4" aria-hidden /> {t('manage.changeTitle')}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {policy.can_reschedule
                  ? t('manage.policyDeadline', { date: formatDateTime(policy.deadline, tz) })
                  : t('manage.policyPassed', { hours: b.business.cancellation_window_hours })}
              </p>
            </CardHeader>
            <CardContent>
              {rescheduling ? (
                <ReschedulePanel booking={b} onDone={() => setRescheduling(false)} />
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button onClick={() => setRescheduling(true)} disabled={!policy.can_reschedule}>
                    {t('manage.reschedule')}
                  </Button>
                  <CancelDialog
                    refund={policy.refund_eligible}
                    hasDeposit={b.deposit_cents > 0 && b.payment?.status === 'approved'}
                    reason={reason}
                    setReason={setReason}
                    onConfirm={cancel}
                    loading={cancelling}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {b.status === 'pending_payment' && policy?.can_cancel && (
          <CancelDialog refund hasDeposit={false} reason={reason} setReason={setReason} onConfirm={cancel} loading={cancelling} />
        )}

        {(b.status === 'cancelled' || b.status === 'expired') && (
          <Button asChild size="lg" className="w-full">
            <Link to={`/${b.business.slug}`}>{t('manage.bookAgain')}</Link>
          </Button>
        )}
        {b.status === 'cancelled' && b.payment?.status && ['refund_pending', 'refunded'].includes(b.payment.status) && (
          <p className="text-center text-sm text-muted-foreground">{t('manage.refundInfo')}</p>
        )}

        <PrivacyPanel token={b.manage_token} onDeleted={() => setDeleted(true)} />
      </div>
    </PublicLayout>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <dt className="mt-0.5 text-muted-foreground [&_svg]:size-4">
        <span aria-hidden>{icon}</span>
        <span className="sr-only">{label}</span>
      </dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

function CancelDialog({
  refund,
  hasDeposit,
  reason,
  setReason,
  onConfirm,
  loading,
}: {
  refund: boolean;
  hasDeposit: boolean;
  reason: string;
  setReason: (v: string) => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  const { t } = useTranslation();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="text-destructive hover:text-destructive" loading={loading}>
          {t('manage.cancel')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('manage.cancelTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {hasDeposit ? (refund ? t('manage.cancelRefund') : t('manage.cancelNoRefund')) : t('manage.cancelText')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-1.5">
          <Label htmlFor="cancel-reason">
            {t('manage.reason')} ({t('common.optional')})
          </Label>
          <Textarea id="cancel-reason" rows={2} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('manage.keep')}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            {t('manage.cancelConfirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
