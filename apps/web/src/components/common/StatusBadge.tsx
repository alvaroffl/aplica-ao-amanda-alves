import type { BookingStatus, Enums } from '@agendae/shared';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';

const bookingVariant: Record<BookingStatus, 'success' | 'warning' | 'destructive' | 'secondary' | 'default'> = {
  confirmed: 'default',
  pending_payment: 'warning',
  completed: 'success',
  no_show: 'destructive',
  cancelled: 'secondary',
  expired: 'secondary',
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const { t } = useTranslation();
  return <Badge variant={bookingVariant[status]}>{t(`status.${status}`)}</Badge>;
}

const paymentVariant: Record<Enums<'payment_status'>, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'destructive',
  cancelled: 'secondary',
  expired: 'secondary',
  refund_pending: 'warning',
  refunded: 'secondary',
};

export function PaymentStatusBadge({ status }: { status: Enums<'payment_status'> }) {
  const { t } = useTranslation();
  return <Badge variant={paymentVariant[status]}>{t(`paymentStatus.${status}`)}</Badge>;
}
