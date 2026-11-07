import type { BookingPolicy } from '@agendae/shared';
import type { TFunction } from 'i18next';

/** Resumo da política para a cliente, a partir das regras configuradas. */
export function policySummary(t: TFunction, policy: BookingPolicy, hasDeposit: boolean): string {
  const parts: string[] = [];
  if (policy.client_can_reschedule) {
    parts.push(t('booking.policy.reschedule', { hours: policy.reschedule_min_hours }));
  }
  if (hasDeposit) {
    parts.push(
      policy.refund_percent === 0
        ? t('booking.policy.noRefund')
        : policy.refund_percent === 100
          ? t('booking.policy.refundFull', { hours: policy.refund_min_hours })
          : t('booking.policy.refundPartial', {
              hours: policy.refund_min_hours,
              percent: policy.refund_percent,
            }),
    );
  }
  if (policy.notes) parts.push(policy.notes);
  return parts.join(' ');
}
