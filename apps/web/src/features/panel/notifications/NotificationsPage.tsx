import { formatDateTime } from '@agendae/shared';
import { useQuery } from '@tanstack/react-query';
import { Bell, Mail, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EmptyState, ErrorState, PageHeader } from '@/components/common/States';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { unwrap } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useBusiness } from '../business';

const statusVariant = {
  pending: 'warning',
  processing: 'warning',
  sent: 'success',
  failed: 'destructive',
  cancelled: 'secondary',
  skipped: 'secondary',
} as const;

export function NotificationsPage() {
  const { t } = useTranslation();
  const { business } = useBusiness();
  const list = useQuery({
    queryKey: ['notifications', business.id],
    refetchInterval: 15_000,
    queryFn: async () =>
      unwrap(
        await supabase
          .from('notifications')
          .select('id, channel, template, recipient, status, attempts, last_error, scheduled_for, sent_at')
          .eq('business_id', business.id)
          .order('scheduled_for', { ascending: false })
          .limit(100),
      ),
  });

  return (
    <div>
      <PageHeader title={t('notifications.title')} description={t('notifications.subtitle')} />
      {list.isPending ? (
        <Skeleton className="h-64" />
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => void list.refetch()} />
      ) : list.data.length === 0 ? (
        <EmptyState icon={<Bell />} title={t('notifications.empty')} />
      ) : (
        <Card className="divide-y">
          {list.data.map((n) => (
            <div key={n.id} className="flex items-start gap-3 p-4 text-sm">
              <span className="mt-0.5 text-muted-foreground" aria-label={n.channel}>
                {n.channel === 'email' ? <Mail className="size-4" /> : <MessageCircle className="size-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{t(`notifications.templates.${n.template}`, { defaultValue: n.template })}</p>
                <p className="truncate text-muted-foreground">{n.recipient}</p>
                {n.last_error && n.status !== 'sent' && <p className="truncate text-xs text-destructive">{n.last_error}</p>}
              </div>
              <div className="text-right">
                <Badge variant={statusVariant[n.status]}>{t(`notifications.status.${n.status}`)}</Badge>
                <p className="mt-1 text-xs tabular-nums text-muted-foreground">{formatDateTime(n.sent_at ?? n.scheduled_for, business.timezone)}</p>
                {n.attempts > 1 && <p className="text-xs text-muted-foreground">{t('notifications.attempts', { count: n.attempts })}</p>}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
