import type { PublicBusiness, Slot } from '@agendae/shared';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MapPin } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { ErrorState, EmptyState } from '@/components/common/States';
import type { TurnstileHandle } from '@/components/common/Turnstile';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api';
import { cn, newIdempotencyKey } from '@/lib/utils';
import { createBooking, usePublicBusiness } from './api';
import { BookingSummary } from './BookingSummary';
import { PublicLayout } from './PublicLayout';
import { StepDateTime } from './StepDateTime';
import { StepDetails, type DetailsSubmit } from './StepDetails';
import { StepProfessional } from './StepProfessional';
import { StepService } from './StepService';

type StepId = 'service' | 'professional' | 'datetime' | 'details';
const P = { unit: 'unidade', service: 'servico', pro: 'profissional', day: 'data', time: 'hora' } as const;
const ANY = 'qualquer';

export function BookingPage() {
  const { slug, unitSlug } = useParams();
  const { t } = useTranslation();
  const query = usePublicBusiness(slug);

  React.useEffect(() => {
    if (query.data) document.title = `${query.data.business.name} — ${t('booking.pageTitle')}`;
  }, [query.data, t]);

  if (query.isPending) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-2xl space-y-4" aria-busy>
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </PublicLayout>
    );
  }
  if (query.isError) {
    const notFound = query.error instanceof ApiError && query.error.code === 'BUSINESS_NOT_FOUND';
    return (
      <PublicLayout>
        {notFound ? (
          <EmptyState headingLevel="h1" title={t('booking.businessNotFound')} description={t('booking.businessNotFoundHint')} />
        ) : (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        )}
      </PublicLayout>
    );
  }
  return <BookingFlow data={query.data} unitSlug={unitSlug} />;
}

function BookingFlow({ data, unitSlug }: { data: PublicBusiness; unitSlug?: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [submitting, setSubmitting] = React.useState(false);
  const captchaRef = React.useRef<TurnstileHandle>(null);
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const { business } = data;

  // ---- Estado derivado da URL ---------------------------------------------
  const prosById = React.useMemo(() => new Map(data.professionals.map((p) => [p.id, p])), [data.professionals]);
  const unit =
    data.units.find((u) => u.slug === unitSlug) ??
    data.units.find((u) => u.id === params.get(P.unit)) ??
    (data.units.length === 1 ? data.units[0] : undefined);

  const services = React.useMemo(
    () => (unit ? data.services.filter((s) => s.professional_ids.some((id) => prosById.get(id)?.unit_ids.includes(unit.id))) : []),
    [data.services, prosById, unit],
  );
  const service = services.find((s) => s.id === params.get(P.service));
  const pros = React.useMemo(
    () => (service && unit ? data.professionals.filter((p) => service.professional_ids.includes(p.id) && p.unit_ids.includes(unit.id)) : []),
    [data.professionals, service, unit],
  );
  const proParam = params.get(P.pro);
  const singlePro = pros.length === 1 ? pros[0] : undefined;
  const professional = singlePro ?? pros.find((p) => p.id === proParam);
  const isAny = !singlePro && proParam === ANY;
  const startsAt = params.get(P.time);
  const day = params.get(P.day);

  const steps: StepId[] = ['service', ...(singlePro ? [] : (['professional'] as const)), 'datetime', 'details'];
  const current: StepId = !unit || !service ? 'service' : !professional && !isAny ? 'professional' : !startsAt ? 'datetime' : 'details';
  const index = steps.indexOf(current);

  // Foco no título a cada passo (leitores de tela anunciam a mudança)
  React.useEffect(() => {
    headingRef.current?.focus();
  }, [current]);

  const idempotencyKey = React.useMemo(
    () => newIdempotencyKey(),
    // nova chave quando muda o que está sendo reservado
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [service?.id, professional?.id, isAny, startsAt],
  );

  const update = (changes: Record<string, string | null>, replace = false) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    setParams(next, { replace });
  };

  const goBack = () => {
    if (current === 'details') update({ [P.time]: null });
    else if (current === 'datetime') update(singlePro ? { [P.service]: null, [P.day]: null } : { [P.pro]: null, [P.day]: null });
    else if (current === 'professional') update({ [P.service]: null });
    else if (!unitSlug && data.units.length > 1) update({ [P.unit]: null });
  };

  const onSubmit = async ({ client, captchaToken, paymentMethod }: DetailsSubmit) => {
    if (!unit || !service || !startsAt) return;
    setSubmitting(true);
    try {
      const booking = await createBooking({
        serviceId: service.id,
        unitId: unit.id,
        professionalId: professional?.id ?? null,
        startsAt,
        client: { ...client, consent: true },
        idempotencyKey,
        captchaToken,
        paymentMethod: service.deposit_cents > 0 ? paymentMethod : undefined,
      });
      navigate(`/r/${booking.manage_token}?novo=1`);
    } catch (e) {
      const err = e instanceof ApiError ? e : new ApiError('INTERNAL_ERROR');
      captchaRef.current?.reset();
      if (err.code === 'SLOT_UNAVAILABLE') {
        toast.error(t('errors.SLOT_UNAVAILABLE'));
        await queryClient.invalidateQueries({ queryKey: ['slots'] });
        update({ [P.time]: null });
      } else if (err.code === 'PAYMENT_PROVIDER_ERROR' && (err.details as { manageToken?: string })?.manageToken) {
        toast.error(t('errors.PAYMENT_PROVIDER_ERROR'));
        navigate(`/r/${(err.details as { manageToken: string }).manageToken}?novo=1`);
      } else {
        toast.error(t(`errors.${err.code}`, { defaultValue: t('errors.INTERNAL_ERROR') }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectSlot = (slot: Slot) => update({ [P.time]: slot.starts_at });
  const selectDay = React.useCallback(
    (d: string) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(P.day, d);
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const titles: Record<StepId, string> = {
    service: !unit ? t('booking.chooseUnit') : t('booking.chooseService'),
    professional: t('booking.chooseProfessional'),
    datetime: t('booking.chooseDateTime'),
    details: t('booking.yourDetails'),
  };

  return (
    <PublicLayout business={business}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {current === 'service' && !service && (
            <div className="mb-6 space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{business.name}</h1>
              {business.description && <p className="text-muted-foreground">{business.description}</p>}
            </div>
          )}

          {/* Progresso */}
          <nav aria-label={t('booking.progress')} className="mb-4">
            <ol className="flex gap-1.5">
              {steps.map((s, i) => (
                <li key={s} className="flex-1">
                  <span className={cn('block h-1.5 rounded-full', i <= index ? 'bg-primary' : 'bg-muted')} />
                  <span className="sr-only">
                    {t(`booking.steps.${s}`)} {i < index ? t('booking.stepDone') : i === index ? t('booking.stepCurrent') : ''}
                  </span>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mb-5 flex items-center gap-2">
            {(index > 0 || (current === 'service' && unit && !unitSlug && data.units.length > 1)) && (
              <Button variant="ghost" size="icon" onClick={goBack} aria-label={t('common.back')}>
                <ArrowLeft aria-hidden />
              </Button>
            )}
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('booking.stepOf', { current: index + 1, total: steps.length })}
              </p>
              <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold outline-none">
                {titles[current]}
              </h2>
            </div>
          </div>

          {/* Resumo compacto no celular */}
          {service && (
            <div className="mb-5 lg:hidden">
              <BookingSummary
                service={service}
                professional={professional}
                anyProfessional={isAny}
                unit={unit}
                startsAt={startsAt}
                currency={business.currency}
                showUnit={data.units.length > 1}
              />
            </div>
          )}

          {!unit ? (
            <ul className="divide-y overflow-hidden rounded-xl border bg-card">
              {data.units.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => update({ [P.unit]: u.id })}
                    className="flex w-full items-start gap-3 px-4 py-4 text-left hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                  >
                    <MapPin className="mt-0.5 size-5 text-primary" aria-hidden />
                    <span>
                      <span className="block font-medium">{u.name}</span>
                      {u.address && <span className="block text-sm text-muted-foreground">{u.address}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : current === 'service' ? (
            <StepService services={services} currency={business.currency} onSelect={(s) => update({ [P.service]: s.id })} />
          ) : current === 'professional' ? (
            <StepProfessional professionals={pros} onSelect={(id) => update({ [P.pro]: id === 'any' ? ANY : id })} />
          ) : current === 'datetime' ? (
            <StepDateTime
              serviceId={service!.id}
              unitId={unit.id}
              unitName={unit.name}
              timeZone={unit.timezone}
              professionalId={professional?.id ?? null}
              selectedDay={day}
              onSelectDay={selectDay}
              onSelectSlot={selectSlot}
            />
          ) : (
            <StepDetails
              depositCents={service!.deposit_cents}
              currency={business.currency}
              cancellationHours={business.cancellation_window_hours}
              submitting={submitting}
              onSubmit={onSubmit}
              captchaRef={captchaRef}
            />
          )}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-3">
            {service ? (
              <BookingSummary
                service={service}
                professional={professional}
                anyProfessional={isAny}
                unit={unit}
                startsAt={startsAt}
                currency={business.currency}
                showUnit
              />
            ) : (
              <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">{t('booking.summaryEmpty')}</div>
            )}
          </div>
        </aside>
      </div>
    </PublicLayout>
  );
}
