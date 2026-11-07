import { addDaysToKey, formatMoney, todayKey, type ReportSummary } from '@agendae/shared';
import { useQuery } from '@tanstack/react-query';
import { BarChart3 } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, ErrorState, PageHeader } from '@/components/common/States';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NativeSelect } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { unwrap } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useBusiness } from '../business';
import { useProfessionals } from '../data';

type Period = '7' | '30' | '90';

function pct(v: number) {
  return `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
}

export function ReportsPage() {
  const { t } = useTranslation();
  const { business } = useBusiness();
  const professionals = useProfessionals();
  const [period, setPeriod] = React.useState<Period>('30');
  const [pro, setPro] = React.useState('');
  const to = todayKey(business.timezone);
  const from = addDaysToKey(to, -(Number(period) - 1));

  const report = useQuery({
    queryKey: ['report', business.id, from, to, pro],
    queryFn: async () =>
      unwrap(
        await supabase.rpc('report_summary', {
          p_business_id: business.id,
          p_from: from,
          p_to: to,
          ...(pro ? { p_professional_id: pro } : {}),
        }),
      ) as unknown as ReportSummary,
  });

  return (
    <div className="space-y-6">
      <PageHeader title={t('reports.title')} description={t('reports.subtitle')} />

      {/* Filtros em uma linha, acima dos gráficos */}
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList aria-label={t('reports.period')}>
            {(['7', '30', '90'] as const).map((p) => (
              <TabsTrigger key={p} value={p}>
                {t('reports.lastDays', { count: Number(p) })}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <NativeSelect value={pro} onChange={(e) => setPro(e.target.value)} className="w-auto min-w-48" aria-label={t('agenda.filterProfessional')}>
          <option value="">{t('agenda.allProfessionals')}</option>
          {(professionals.data ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </NativeSelect>
      </div>

      {report.isPending ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : report.isError ? (
        <ErrorState error={report.error} onRetry={() => void report.refetch()} />
      ) : report.data.total === 0 ? (
        <EmptyState icon={<BarChart3 />} title={t('reports.empty')} description={t('reports.emptyHint')} />
      ) : (
        <ReportContent data={report.data} currency={business.currency} from={from} to={to} />
      )}
    </div>
  );
}

function ReportContent({ data, currency, from, to }: { data: ReportSummary; currency: string; from: string; to: string }) {
  const { t } = useTranslation();
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label={t('reports.occupancy')} value={pct(data.occupancy_rate)} hint={t('reports.occupancyHint', { booked: Math.round(data.booked_minutes / 60), available: Math.round(data.available_minutes / 60) })} />
        <StatTile label={t('reports.noShowRate')} value={pct(data.no_show_rate)} hint={t('reports.noShowHint', { count: data.no_show })} />
        <StatTile label={t('reports.revenue')} value={formatMoney(data.revenue_realized_cents, currency)} hint={t('reports.revenueHint', { count: data.completed })} />
        <StatTile label={t('reports.expected')} value={formatMoney(data.revenue_expected_cents, currency)} hint={t('reports.expectedHint', { count: data.confirmed })} />
        <StatTile label={t('reports.bookings')} value={String(data.total)} />
        <StatTile label={t('reports.completed')} value={String(data.completed)} />
        <StatTile label={t('reports.cancelled')} value={String(data.cancelled)} />
        <StatTile label={t('reports.deposits')} value={formatMoney(data.deposits_cents, currency)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.byDay')}</CardTitle>
            <CardDescription>{t('reports.byDayHint')}</CardDescription>
          </CardHeader>
          <CardContent>
            <DailyBars rows={data.by_day} from={from} to={to} currency={currency} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.topServices')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {data.top_services.map((s, i) => {
                const max = data.top_services[0]?.count ?? 1;
                return (
                  <li key={s.id} className="space-y-1">
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="truncate">
                        <span className="mr-1.5 tabular-nums text-muted-foreground">{i + 1}.</span>
                        {s.name}
                      </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {t('reports.timesBooked', { count: s.count })}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted" aria-hidden>
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${(s.count / max) * 100}%` }} />
                    </div>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}

/**
 * Barras diárias (série única → sem legenda; o título nomeia a série).
 * Barras finas com topo arredondado ancoradas na base, 2px de espaço entre
 * barras, dica no hover/foco e tabela equivalente para leitores de tela.
 */
function DailyBars({ rows, from, to, currency }: { rows: ReportSummary['by_day']; from: string; to: string; currency: string }) {
  const { t } = useTranslation();
  const [active, setActive] = React.useState<string | null>(null);
  const days: string[] = [];
  for (let d = from; d <= to; d = addDaysToKey(d, 1)) days.push(d);
  const byDay = new Map(rows.map((r) => [r.day, r]));
  const max = Math.max(1, ...rows.map((r) => r.bookings));
  const ticks = [max, Math.round(max / 2), 0];
  const fmt = (d: string) => d.slice(8, 10) + '/' + d.slice(5, 7);
  const current = active ? byDay.get(active) : null;

  return (
    <div>
      <div className="mb-2 h-5 text-sm" aria-live="polite">
        {active && (
          <span>
            <span className="font-medium tabular-nums">{fmt(active)}</span>
            {' · '}
            {t('reports.tooltip', {
              count: current?.bookings ?? 0,
              noShow: current?.no_show ?? 0,
              revenue: formatMoney(current?.revenue_cents ?? 0, currency),
            })}
          </span>
        )}
      </div>
      <div className="flex gap-2" aria-hidden>
        <div className="flex h-44 flex-col justify-between text-right text-[11px] tabular-nums text-muted-foreground">
          {ticks.map((v, i) => (
            <span key={i}>{v}</span>
          ))}
        </div>
        <div className="relative h-44 flex-1">
          <div className="absolute inset-0 flex flex-col justify-between">
            {ticks.map((_, i) => (
              <div key={i} className="border-t border-border/60" />
            ))}
          </div>
          <div className="absolute inset-0 flex items-end gap-[2px]">
            {days.map((d) => {
              const v = byDay.get(d)?.bookings ?? 0;
              return (
                <div
                  key={d}
                  className="group flex h-full flex-1 items-end"
                  onMouseEnter={() => setActive(d)}
                  onMouseLeave={() => setActive(null)}
                >
                  <div
                    className="w-full rounded-t-[4px] bg-primary/85 transition-colors group-hover:bg-primary"
                    style={{ height: `${(v / max) * 100}%`, minHeight: v ? 2 : 0 }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="ml-6 mt-1 flex justify-between text-[11px] tabular-nums text-muted-foreground" aria-hidden>
        <span>{fmt(from)}</span>
        <span>{fmt(to)}</span>
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-muted-foreground">{t('reports.viewTable')}</summary>
        <table className="mt-2 w-full text-left text-sm">
          <caption className="sr-only">{t('reports.byDay')}</caption>
          <thead className="text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="py-1 font-medium">{t('reports.day')}</th>
              <th scope="col" className="py-1 text-right font-medium">{t('reports.bookings')}</th>
              <th scope="col" className="py-1 text-right font-medium">{t('reports.noShowsCol')}</th>
              <th scope="col" className="py-1 text-right font-medium">{t('reports.revenue')}</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {rows.map((r) => (
              <tr key={r.day} className="border-t">
                <td className="py-1">{fmt(r.day)}</td>
                <td className="py-1 text-right">{r.bookings}</td>
                <td className="py-1 text-right">{r.no_show}</td>
                <td className="py-1 text-right">{formatMoney(r.revenue_cents, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
