import { clientSchema, formatDateTime, formatMoney, formatPhone, whatsappShareUrl } from '@agendae/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Download, MessageCircle, ShieldAlert } from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { toast } from 'sonner';
import type { z } from 'zod';
import { EmptyState, ErrorState } from '@/components/common/States';
import { BookingStatusBadge } from '@/components/common/StatusBadge';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input, Textarea } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toApiError, unwrap, unwrapMaybe } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useBusiness } from '../business';
import { BOOKING_SELECT, type BookingRow } from '../data';

type Form = z.input<typeof clientSchema>;

export function ClientDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { business, can } = useBusiness();

  const client = useQuery({
    queryKey: ['client', id],
    queryFn: async () => unwrap(await supabase.from('clients').select('*').eq('id', id!).single()),
  });
  const stats = useQuery({
    queryKey: ['client-stats', id],
    queryFn: async () => unwrapMaybe(await supabase.from('client_stats').select('*').eq('client_id', id!).maybeSingle()),
  });
  const history = useQuery({
    queryKey: ['client-bookings', id],
    queryFn: async () =>
      unwrap(await supabase.from('bookings').select(BOOKING_SELECT).eq('client_id', id!).order('starts_at', { ascending: false }).limit(100)) as unknown as BookingRow[],
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Form, unknown, z.output<typeof clientSchema>>({ resolver: zodResolver(clientSchema) });

  React.useEffect(() => {
    if (client.data) {
      reset({ name: client.data.name, email: client.data.email ?? '', phone: client.data.phone ?? '', notes: client.data.notes ?? '' });
    }
  }, [client.data, reset]);

  if (client.isPending) return <Skeleton className="h-96" />;
  if (client.isError) return <ErrorState error={client.error} onRetry={() => void client.refetch()} />;
  const c = client.data;
  const editable = can('clients.edit') && !c.anonymized_at;

  const onSubmit = handleSubmit(async (v) => {
    try {
      unwrap(await supabase.from('clients').update({ name: v.name, email: v.email, phone: v.phone, notes: v.notes || null }).eq('id', c.id));
      await qc.invalidateQueries({ queryKey: ['client', id] });
      toast.success(t('common.saved'));
    } catch (e) {
      toast.error(t(`errors.${toApiError(e).code}`));
    }
  });

  const exportData = async () => {
    try {
      const data = unwrap(await supabase.rpc('lgpd_export_client', { p_client_id: c.id }));
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      Object.assign(document.createElement('a'), { href: url, download: `cliente-${c.id}.json` }).click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(t(`errors.${toApiError(e).code}`));
    }
  };

  const anonymize = async () => {
    try {
      unwrap(await supabase.rpc('lgpd_anonymize_client', { p_client_id: c.id }));
      await qc.invalidateQueries({ queryKey: ['client', id] });
      await qc.invalidateQueries({ queryKey: ['client-bookings', id] });
      toast.success(t('clients.anonymizedDone'));
    } catch (e) {
      toast.error(t(`errors.${toApiError(e).code}`));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/painel/clientes" aria-label={t('common.back')}>
              <ArrowLeft aria-hidden />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{c.name}</h1>
            <p className="text-sm text-muted-foreground">
              {t('clients.since', { date: formatDateTime(c.created_at, business.timezone).split(' ')[0] })}
              {c.consent_at && ` · ${t('clients.consentGiven')}`}
            </p>
          </div>
          {c.anonymized_at && <Badge variant="secondary">{t('clients.anonymized')}</Badge>}
        </div>
        {c.phone && !c.anonymized_at && (
          <Button variant="outline" asChild>
            <a href={whatsappShareUrl(t('clients.whatsappHello', { name: c.name.split(' ')[0], business: business.name }), c.phone)} target="_blank" rel="noreferrer">
              <MessageCircle aria-hidden /> WhatsApp
            </a>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={t('clients.statVisits')} value={String(stats.data?.completed_count ?? 0)} />
        <Stat label={t('clients.statNoShows')} value={String(stats.data?.no_show_count ?? 0)} danger={(stats.data?.no_show_count ?? 0) > 0} />
        <Stat label={t('clients.statRevenue')} value={formatMoney(stats.data?.revenue_cents ?? 0, business.currency)} />
        <Stat
          label={t('clients.statNext')}
          value={stats.data?.next_booking_at ? formatDateTime(stats.data.next_booking_at, business.timezone) : '—'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{t('clients.details')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} noValidate className="space-y-4">
              <fieldset disabled={!editable} className="space-y-4">
                <Field label={t('booking.name')} htmlFor="c-name" error={errors.name?.message}>
                  <Input {...register('name')} />
                </Field>
                <Field label={t('booking.phone')} htmlFor="c-phone" error={errors.phone?.message} hint={c.phone ? formatPhone(c.phone) : undefined}>
                  <Input type="tel" {...register('phone')} />
                </Field>
                <Field label={t('booking.email')} htmlFor="c-email" error={errors.email?.message}>
                  <Input type="email" {...register('email')} />
                </Field>
                <Field label={t('clients.notes')} htmlFor="c-notes" error={errors.notes?.message} hint={t('clients.notesHint')}>
                  <Textarea rows={4} {...register('notes')} />
                </Field>
              </fieldset>
              {editable && (
                <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
                  {t('common.save')}
                </Button>
              )}
            </form>

            {can('clients.lgpd') && !c.anonymized_at && (
              <div className="mt-6 space-y-2 rounded-lg border border-dashed p-3">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <ShieldAlert className="size-4" aria-hidden /> {t('clients.lgpdTitle')}
                </p>
                <p className="text-xs text-muted-foreground">{t('clients.lgpdHint')}</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={exportData}>
                    <Download aria-hidden /> {t('clients.export')}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        {t('clients.anonymize')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('clients.anonymizeTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>{t('clients.anonymizeText')}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={anonymize}>
                          {t('clients.anonymizeConfirm')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('clients.history')}</CardTitle>
          </CardHeader>
          <CardContent>
            {history.isPending ? (
              <Skeleton className="h-40" />
            ) : !history.data?.length ? (
              <EmptyState title={t('clients.noHistory')} />
            ) : (
              <ul className="divide-y">
                {history.data.map((b) => (
                  <li key={b.id} className="flex items-center gap-3 py-3 text-sm">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: b.professional?.color }} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{b.service?.name}</p>
                      <p className="text-muted-foreground">
                        {formatDateTime(b.starts_at, b.unit?.timezone ?? business.timezone)} · {b.professional?.name}
                      </p>
                    </div>
                    <span className="tabular-nums text-muted-foreground">{formatMoney(b.price_cents, business.currency)}</span>
                    <BookingStatusBadge status={b.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${danger ? 'text-destructive' : ''}`}>{value}</p>
    </Card>
  );
}
