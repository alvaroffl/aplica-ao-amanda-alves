import { formatPhone, panelBookingSchema, zonedToUtc } from '@agendae/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, UserPlus, X } from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input, NativeSelect, Textarea } from '@/components/ui/input';
import { toApiError, unwrap } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useBusiness } from '../business';
import { useProfessionals, useServices, useUnits, type Client } from '../data';

type Form = z.input<typeof panelBookingSchema>;
type Output = z.output<typeof panelBookingSchema>;

export interface NewBookingDefaults {
  date: string;
  time: string;
  professionalId?: string;
}

/** Remove caracteres especiais do filtro "or" do PostgREST. */
export function sanitizeSearch(q: string) {
  return q.replace(/[,()*%\\]/g, ' ').trim();
}

export function useClientSearch(search: string) {
  const { business } = useBusiness();
  const q = sanitizeSearch(search);
  return useQuery({
    queryKey: ['client-search', business.id, q],
    enabled: q.length >= 2,
    queryFn: async () =>
      unwrap(
        await supabase
          .from('clients')
          .select('id, name, email, phone')
          .eq('business_id', business.id)
          .is('anonymized_at', null)
          .or(`name.ilike.*${q}*,email.ilike.*${q}*,phone.ilike.*${q.replace(/\D/g, '') || q}*`)
          .order('name')
          .limit(8),
      ) as Pick<Client, 'id' | 'name' | 'email' | 'phone'>[],
  });
}

export function NewBookingDialog({
  defaults,
  onClose,
}: {
  defaults: NewBookingDefaults | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { business, myProfessionalId, can } = useBusiness();
  const services = useServices();
  const professionals = useProfessionals();
  const units = useUnits();
  const [search, setSearch] = React.useState('');
  const [selectedClient, setSelectedClient] = React.useState<Pick<
    Client,
    'id' | 'name' | 'phone'
  > | null>(null);
  const [newClient, setNewClient] = React.useState(false);
  const results = useClientSearch(search);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Form, unknown, Output>({ resolver: zodResolver(panelBookingSchema) });

  React.useEffect(() => {
    if (!defaults) return;
    const firstUnit = units.data?.find((u) => u.active);
    reset({
      date: defaults.date,
      time: defaults.time,
      professional_id:
        defaults.professionalId ?? (can('agenda.viewAll') ? '' : (myProfessionalId ?? '')),
      unit_id: firstUnit?.id ?? '',
      service_id: '',
      client_id: null,
      client_name: '',
      internal_notes: '',
    });
    setSelectedClient(null);
    setNewClient(false);
    setSearch('');
  }, [defaults, reset, units.data, can, myProfessionalId]);

  const serviceId = watch('service_id');
  const unitId = watch('unit_id');
  const pros = (professionals.data ?? []).filter(
    (p) =>
      p.active &&
      (!serviceId || p.service_ids.includes(serviceId)) &&
      (!unitId || p.unit_ids.includes(unitId)),
  );

  const onSubmit = handleSubmit(async (v) => {
    const unit = units.data?.find((u) => u.id === v.unit_id);
    const startsAt = zonedToUtc(v.date, v.time, unit?.timezone ?? business.timezone).toISOString();
    try {
      unwrap(
        await supabase.rpc('panel_create_booking', {
          p_business_id: business.id,
          p_service_id: v.service_id,
          p_unit_id: v.unit_id,
          p_professional_id: v.professional_id,
          p_starts_at: startsAt,
          ...(v.client_id
            ? { p_client_id: v.client_id }
            : {
                p_client_name: v.client_name,
                ...(v.client_email ? { p_client_email: v.client_email } : {}),
                ...(v.client_phone ? { p_client_phone: v.client_phone } : {}),
              }),
          p_internal_notes: v.internal_notes,
        }),
      );
      toast.success(t('agenda.created'));
      await qc.invalidateQueries({ queryKey: ['bookings', business.id] });
      onClose();
    } catch (e) {
      const code = toApiError(e).code;
      toast.error(t(`errors.${code}`, { defaultValue: t('errors.INTERNAL_ERROR') }));
    }
  });

  return (
    <Dialog open={Boolean(defaults)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('agenda.newBooking')}</DialogTitle>
          <DialogDescription>{t('agenda.newBookingHint')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t('agenda.service')}
              htmlFor="service_id"
              error={errors.service_id?.message}
              className="sm:col-span-2"
            >
              <NativeSelect {...register('service_id')}>
                <option value="">{t('common.select')}</option>
                {(services.data ?? [])
                  .filter((s) => s.active)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} · {s.duration_min} min
                    </option>
                  ))}
              </NativeSelect>
            </Field>
            {(units.data?.length ?? 0) > 1 && (
              <Field
                label={t('agenda.unit')}
                htmlFor="unit_id"
                error={errors.unit_id?.message}
                className="sm:col-span-2"
              >
                <NativeSelect {...register('unit_id')}>
                  {units.data!.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            )}
            <Field
              label={t('agenda.professional')}
              htmlFor="professional_id"
              error={errors.professional_id?.message}
              className="sm:col-span-2"
            >
              <NativeSelect {...register('professional_id')} disabled={!can('agenda.viewAll')}>
                <option value="">{t('common.select')}</option>
                {pros.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label={t('agenda.date')} htmlFor="date" error={errors.date?.message}>
              <Input type="date" {...register('date')} />
            </Field>
            <Field label={t('agenda.time')} htmlFor="time" error={errors.time?.message}>
              <Input type="time" step={300} {...register('time')} />
            </Field>
          </div>

          <fieldset className="space-y-3 rounded-lg border p-3">
            <legend className="px-1 text-sm font-medium">{t('agenda.client')}</legend>
            {selectedClient ? (
              <div className="flex items-center justify-between rounded-md bg-accent px-3 py-2 text-sm">
                <span>
                  <span className="font-medium">{selectedClient.name}</span>{' '}
                  <span className="text-muted-foreground">{formatPhone(selectedClient.phone)}</span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t('common.remove')}
                  onClick={() => {
                    setSelectedClient(null);
                    setValue('client_id', null);
                  }}
                >
                  <X aria-hidden />
                </Button>
              </div>
            ) : newClient ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label={t('booking.name')}
                  htmlFor="client_name"
                  error={errors.client_name?.message}
                  className="sm:col-span-2"
                >
                  <Input {...register('client_name')} />
                </Field>
                <Field
                  label={t('booking.phone')}
                  htmlFor="client_phone"
                  error={errors.client_phone?.message}
                >
                  <Input type="tel" {...register('client_phone')} />
                </Field>
                <Field
                  label={t('booking.email')}
                  htmlFor="client_email"
                  error={errors.client_email?.message}
                >
                  <Input type="email" {...register('client_email')} />
                </Field>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('agenda.searchClient')}
                    aria-label={t('agenda.searchClient')}
                    className="pl-9"
                  />
                </div>
                {results.data && results.data.length > 0 && (
                  <ul className="max-h-44 divide-y overflow-y-auto rounded-md border">
                    {results.data.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                          onClick={() => {
                            setSelectedClient(c);
                            setValue('client_id', c.id);
                          }}
                        >
                          <span className="font-medium">{c.name}</span>{' '}
                          <span className="text-muted-foreground">
                            {formatPhone(c.phone) || c.email}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {errors.client_name && (
                  <p role="alert" className="text-xs font-medium text-destructive">
                    {t(errors.client_name.message ?? 'validation.clientRequired')}
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewClient(true);
                    setValue('client_name', search);
                  }}
                >
                  <UserPlus aria-hidden /> {t('agenda.newClient')}
                </Button>
              </div>
            )}
          </fieldset>

          <Field
            label={`${t('agenda.internalNotes')} (${t('common.optional')})`}
            htmlFor="internal_notes"
          >
            <Textarea rows={2} {...register('internal_notes')} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {t('agenda.createBooking')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
