import { formatDateTime, formatMoney, formatPhone } from '@agendae/shared';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Search, UsersRound } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { EmptyState, ErrorState, PageHeader } from '@/components/common/States';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { unwrap } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useBusiness } from '../business';
import { sanitizeSearch } from '../agenda/NewBookingDialog';

const PAGE = 50;

export function ClientsPage() {
  const { t } = useTranslation();
  const { business } = useBusiness();
  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  React.useEffect(() => {
    const id = window.setTimeout(() => setDebounced(sanitizeSearch(search)), 250);
    return () => window.clearTimeout(id);
  }, [search]);

  const clients = useQuery({
    queryKey: ['clients', business.id, debounced],
    queryFn: async () => {
      let q = supabase
        .from('clients')
        .select('id, name, email, phone, anonymized_at, created_at')
        .eq('business_id', business.id)
        .order('name')
        .limit(PAGE);
      if (debounced) q = q.or(`name.ilike.*${debounced}*,email.ilike.*${debounced}*,phone.ilike.*${debounced.replace(/\D/g, '') || debounced}*`);
      const rows = unwrap(await q);
      const stats = rows.length
        ? unwrap(await supabase.from('client_stats').select('*').in('client_id', rows.map((r) => r.id)))
        : [];
      return rows.map((r) => ({ ...r, stats: stats.find((s) => s.client_id === r.id) }));
    },
  });

  return (
    <div>
      <PageHeader title={t('clients.title')} description={t('clients.subtitle')} />
      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('clients.search')}
          aria-label={t('clients.search')}
          className="pl-9"
        />
      </div>
      {clients.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : clients.isError ? (
        <ErrorState error={clients.error} onRetry={() => void clients.refetch()} />
      ) : clients.data.length === 0 ? (
        <EmptyState icon={<UsersRound />} title={debounced ? t('clients.noResults') : t('clients.empty')} description={t('clients.emptyHint')} />
      ) : (
        <Card className="divide-y">
          {clients.data.map((c) => (
            <Link key={c.id} to={`/painel/clientes/${c.id}`} className="flex items-center gap-4 p-4 hover:bg-accent focus-visible:bg-accent focus-visible:outline-none">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {c.name} {c.anonymized_at && <Badge variant="secondary">{t('clients.anonymized')}</Badge>}
                </p>
                <p className="truncate text-sm text-muted-foreground">{[formatPhone(c.phone), c.email].filter(Boolean).join(' · ')}</p>
              </div>
              <div className="hidden text-right text-sm sm:block">
                <p className="tabular-nums">{t('clients.visits', { count: c.stats?.completed_count ?? 0 })}</p>
                {(c.stats?.no_show_count ?? 0) > 0 && (
                  <p className="text-destructive">{t('clients.noShows', { count: c.stats!.no_show_count! })}</p>
                )}
              </div>
              <div className="hidden w-40 text-right text-sm text-muted-foreground md:block">
                {c.stats?.next_booking_at ? (
                  <span className="text-foreground">{formatDateTime(c.stats.next_booking_at, business.timezone)}</span>
                ) : c.stats?.revenue_cents ? (
                  formatMoney(c.stats.revenue_cents, business.currency)
                ) : null}
              </div>
              <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
