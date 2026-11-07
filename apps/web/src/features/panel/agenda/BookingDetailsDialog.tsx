import { formatDateTime, formatMoney, formatPhone, formatTime, whatsappShareUrl } from '@agendae/shared';
import { useQueryClient } from '@tanstack/react-query';
import { Ban, CheckCircle2, MessageCircle, UserX } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { BookingStatusBadge, PaymentStatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toApiError } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useBusiness } from '../business';
import type { BookingRow } from '../data';

export function BookingDetailsDialog({ booking, onClose }: { booking: BookingRow | null; onClose: () => void }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { business } = useBusiness();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = React.useState(false);
  const [refund, setRefund] = React.useState(true);
  const [reason, setReason] = React.useState('');

  React.useEffect(() => {
    setConfirmCancel(false);
    setReason('');
    setRefund(true);
  }, [booking?.id]);

  if (!booking) return null;
  const tz = booking.unit?.timezone ?? business.timezone;
  const past = Date.parse(booking.starts_at) <= Date.now();
  const active = booking.status === 'confirmed' || booking.status === 'pending_payment';
  const payment = booking.payments[0];

  const refresh = () => qc.invalidateQueries({ queryKey: ['bookings', business.id] });

  const setStatus = async (status: 'completed' | 'no_show') => {
    setBusy(status);
    const { error } = await supabase.from('bookings').update({ status }).eq('id', booking.id);
    setBusy(null);
    if (error) return toast.error(t(`errors.${toApiError(error).code}`));
    toast.success(t(`agenda.statusChanged.${status}`));
    await refresh();
    onClose();
  };

  const cancel = async () => {
    setBusy('cancel');
    const { error } = await supabase.rpc('panel_cancel_booking', { p_booking_id: booking.id, p_reason: reason, p_refund: refund });
    setBusy(null);
    if (error) return toast.error(t(`errors.${toApiError(error).code}`));
    toast.success(t('agenda.cancelled'));
    await refresh();
    onClose();
  };

  const reminderText = t('agenda.whatsappReminder', {
    name: booking.client?.name.split(' ')[0] ?? '',
    business: business.name,
    service: booking.service?.name ?? '',
    when: formatDateTime(booking.starts_at, tz),
  });

  return (
    <Dialog open={Boolean(booking)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full" style={{ backgroundColor: booking.professional?.color ?? 'gray' }} aria-hidden />
            <DialogTitle>{booking.service?.name}</DialogTitle>
          </div>
          <DialogDescription className="first-letter:uppercase">
            {formatDateTime(booking.starts_at, tz)} – {formatTime(booking.ends_at, tz)} · {booking.professional?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <BookingStatusBadge status={booking.status} />
          {payment && <PaymentStatusBadge status={payment.status} />}
          <span className="text-xs text-muted-foreground">{t(`agenda.source.${booking.source}`)}</span>
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">{t('agenda.client')}</dt>
          <dd>
            {booking.client ? (
              <Link to={`/painel/clientes/${booking.client.id}`} className="font-medium text-primary hover:underline">
                {booking.client.name}
              </Link>
            ) : (
              '—'
            )}
          </dd>
          {booking.client?.phone && (
            <>
              <dt className="text-muted-foreground">{t('agenda.phone')}</dt>
              <dd>
                <a href={`tel:${booking.client.phone}`} className="hover:underline">
                  {formatPhone(booking.client.phone)}
                </a>
              </dd>
            </>
          )}
          {booking.client?.email && (
            <>
              <dt className="text-muted-foreground">{t('agenda.email')}</dt>
              <dd className="truncate">{booking.client.email}</dd>
            </>
          )}
          <dt className="text-muted-foreground">{t('booking.price')}</dt>
          <dd className="tabular-nums">{formatMoney(booking.price_cents, business.currency)}</dd>
          {booking.notes && (
            <>
              <dt className="text-muted-foreground">{t('agenda.clientNotes')}</dt>
              <dd>{booking.notes}</dd>
            </>
          )}
          {booking.internal_notes && (
            <>
              <dt className="text-muted-foreground">{t('agenda.internalNotes')}</dt>
              <dd>{booking.internal_notes}</dd>
            </>
          )}
          {booking.cancel_reason && (
            <>
              <dt className="text-muted-foreground">{t('agenda.cancelReason')}</dt>
              <dd>{booking.cancel_reason}</dd>
            </>
          )}
        </dl>

        {confirmCancel ? (
          <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <div className="grid gap-1.5">
              <Label htmlFor="reason">{t('manage.reason')}</Label>
              <Textarea id="reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            {payment?.status === 'approved' && (
              <div className="flex items-center gap-2">
                <Checkbox id="refund" checked={refund} onCheckedChange={(v) => setRefund(v === true)} />
                <label htmlFor="refund" className="text-sm">
                  {t('agenda.refundDeposit', { amount: formatMoney(payment.amount_cents, business.currency) })}
                </label>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmCancel(false)}>
                {t('common.back')}
              </Button>
              <Button variant="destructive" size="sm" onClick={cancel} loading={busy === 'cancel'}>
                {t('agenda.confirmCancel')}
              </Button>
            </div>
          </div>
        ) : (
          <DialogFooter className="sm:justify-between">
            {booking.client?.phone && active && !past ? (
              <Button variant="ghost" asChild>
                <a href={whatsappShareUrl(reminderText, booking.client.phone)} target="_blank" rel="noreferrer">
                  <MessageCircle aria-hidden /> {t('agenda.sendWhatsApp')}
                </a>
              </Button>
            ) : (
              <span />
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              {active && (
                <Button variant="outline" onClick={() => setConfirmCancel(true)}>
                  <Ban aria-hidden /> {t('agenda.cancel')}
                </Button>
              )}
              {booking.status === 'confirmed' && past && (
                <>
                  <Button variant="outline" onClick={() => setStatus('no_show')} loading={busy === 'no_show'}>
                    <UserX aria-hidden /> {t('agenda.markNoShow')}
                  </Button>
                  <Button onClick={() => setStatus('completed')} loading={busy === 'completed'}>
                    <CheckCircle2 aria-hidden /> {t('agenda.markCompleted')}
                  </Button>
                </>
              )}
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
