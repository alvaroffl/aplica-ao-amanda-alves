import {
  formatDateTime,
  formatMoney,
  parseMoneyToCents,
  paymentMethodLabel,
  type PaymentStatus,
} from '@agendae/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RotateCcw, Wallet } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { EmptyState, ErrorState, PageHeader } from '@/components/common/States';
import { PaymentStatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input, NativeSelect } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toApiError, unwrap } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useBusiness } from '../business';

const STATUSES: PaymentStatus[] = [
  'pending',
  'approved',
  'expired',
  'rejected',
  'refund_pending',
  'refunded',
  'cancelled',
];

interface PaymentRow {
  id: string;
  status: PaymentStatus;
  method: 'pix' | 'card';
  method_detail: string | null;
  installments: number | null;
  amount_cents: number;
  refunded_cents: number;
  refund_requested_cents: number | null;
  test_mode: boolean;
  provider: string;
  provider_payment_id: string | null;
  last_error: string | null;
  created_at: string;
  booking: {
    id: string;
    starts_at: string;
    price_cents: number;
    client: { id: string; name: string } | null;
    service: { name: string } | null;
  } | null;
}

/** Pagamentos por agendamento: status, valor, método e estorno (admin). */
export function PaymentsPage() {
  const { t } = useTranslation();
  const { business, can } = useBusiness();
  const [status, setStatus] = React.useState<PaymentStatus | 'all'>('all');
  const [refunding, setRefunding] = React.useState<PaymentRow | null>(null);

  const list = useQuery({
    queryKey: ['payments', business.id, status],
    refetchInterval: 20_000,
    queryFn: async () => {
      let q = supabase
        .from('payments')
        .select(
          'id, status, method, method_detail, installments, amount_cents, refunded_cents, refund_requested_cents, test_mode, provider, provider_payment_id, last_error, created_at, booking:bookings(id, starts_at, price_cents, client:clients(id, name), service:services(name))',
        )
        .eq('business_id', business.id)
        .order('created_at', { ascending: false })
        .limit(200);
      if (status !== 'all') q = q.eq('status', status);
      return unwrap(await q) as unknown as PaymentRow[];
    },
  });

  const totals = React.useMemo(() => {
    const rows = list.data ?? [];
    const received = rows
      .filter((p) => ['approved', 'refund_pending', 'refunded'].includes(p.status))
      .reduce((sum, p) => sum + p.amount_cents - p.refunded_cents, 0);
    const refunded = rows.reduce((sum, p) => sum + p.refunded_cents, 0);
    return { received, refunded };
  }, [list.data]);

  return (
    <div>
      <PageHeader title={t('payments.title')} description={t('payments.subtitle')} />

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <Field label={t('payments.filter')} htmlFor="payment-status" className="w-56">
          <NativeSelect
            value={status}
            onChange={(e) => setStatus(e.target.value as PaymentStatus | 'all')}
          >
            <option value="all">{t('payments.all')}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`paymentStatus.${s}`)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        {list.data && list.data.length > 0 && (
          <dl className="flex gap-6 text-sm">
            <div>
              <dt className="text-muted-foreground">{t('payments.received')}</dt>
              <dd className="font-semibold tabular-nums">{formatMoney(totals.received)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t('payments.refundedTotal')}</dt>
              <dd className="font-semibold tabular-nums">{formatMoney(totals.refunded)}</dd>
            </div>
          </dl>
        )}
      </div>

      {list.isPending ? (
        <Skeleton className="h-64" />
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => void list.refetch()} />
      ) : list.data.length === 0 ? (
        <EmptyState
          icon={<Wallet />}
          title={t('payments.empty')}
          description={t('payments.emptyHint')}
        />
      ) : (
        <Card className="divide-y">
          {list.data.map((p) => (
            <div key={p.id} className="flex flex-wrap items-start gap-3 p-4 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {p.booking?.service?.name ?? '—'}
                  {p.booking?.client && (
                    <>
                      {' · '}
                      <Link
                        to={`/painel/clientes/${p.booking.client.id}`}
                        className="text-primary underline underline-offset-4"
                      >
                        {p.booking.client.name}
                      </Link>
                    </>
                  )}
                </p>
                <p className="text-muted-foreground">
                  {p.booking
                    ? t('payments.appointment', {
                        when: formatDateTime(p.booking.starts_at, business.timezone),
                      })
                    : null}
                </p>
                <p className="text-muted-foreground">
                  {paymentMethodLabel(p.method, p.method_detail, p.installments)}
                  {p.provider_payment_id && (
                    <span className="ml-2 text-xs">#{p.provider_payment_id}</span>
                  )}
                </p>
                {p.last_error && p.status === 'refund_pending' && (
                  <p className="truncate text-xs text-destructive">{p.last_error}</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-semibold tabular-nums">{formatMoney(p.amount_cents)}</p>
                {p.refunded_cents > 0 && (
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {t('payments.refundedAmount', { amount: formatMoney(p.refunded_cents) })}
                  </p>
                )}
                <div className="mt-1 flex flex-wrap justify-end gap-1">
                  {p.test_mode && <Badge variant="outline">{t('payments.test')}</Badge>}
                  <PaymentStatusBadge status={p.status} />
                </div>
                <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                  {formatDateTime(p.created_at, business.timezone)}
                </p>
                {can('payments.refund') && p.status === 'approved' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => setRefunding(p)}
                  >
                    <RotateCcw aria-hidden /> {t('payments.refund')}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}

      <RefundDialog payment={refunding} onClose={() => setRefunding(null)} />
    </div>
  );
}

function RefundDialog({ payment, onClose }: { payment: PaymentRow | null; onClose: () => void }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [value, setValue] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const max = payment ? payment.amount_cents - payment.refunded_cents : 0;

  React.useEffect(() => {
    setValue(payment ? (max / 100).toFixed(2).replace('.', ',') : '');
    setError(undefined);
  }, [payment, max]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment) return;
    const cents = parseMoneyToCents(value);
    if (!cents || cents < 1 || cents > max) {
      setError(t('payments.refundInvalid', { max: formatMoney(max) }));
      return;
    }
    setBusy(true);
    try {
      unwrap(
        await supabase.rpc('panel_refund_payment', {
          p_payment_id: payment.id,
          p_amount_cents: cents,
        }),
      );
      await qc.invalidateQueries({ queryKey: ['payments'] });
      toast.success(t('payments.refundQueued'));
      onClose();
    } catch (err) {
      toast.error(
        t(`errors.${toApiError(err).code}`, { defaultValue: t('errors.INTERNAL_ERROR') }),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={Boolean(payment)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <form onSubmit={submit} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t('payments.refundTitle')}</DialogTitle>
            <DialogDescription>
              {payment?.test_mode ? t('payments.refundTextTest') : t('payments.refundText')}
            </DialogDescription>
          </DialogHeader>
          <Field
            label={t('payments.refundAmount')}
            htmlFor="refund-amount"
            error={error}
            hint={t('payments.refundMax', { max: formatMoney(max) })}
          >
            <Input inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="destructive" loading={busy}>
              {t('payments.refundConfirm')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
