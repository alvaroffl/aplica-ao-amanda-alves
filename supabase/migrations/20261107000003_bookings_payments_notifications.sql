-- =============================================================================
-- 0003 · Reservas, pagamentos, notificações (outbox), auditoria, rate limit
-- =============================================================================

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  unit_id uuid not null,
  professional_id uuid not null,
  service_id uuid not null,
  client_id uuid not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  -- buffers copiados do serviço no momento da reserva (histórico estável)
  buffer_before_min integer not null default 0,
  buffer_after_min integer not null default 0,
  -- período efetivamente ocupado na agenda do profissional (com buffers)
  occupied tstzrange generated always as (
    tstzrange(
      public.add_minutes(starts_at, -buffer_before_min),
      public.add_minutes(ends_at, buffer_after_min),
      '[)'
    )
  ) stored,
  status public.booking_status not null default 'confirmed',
  source public.booking_source not null default 'public',
  price_cents integer not null default 0,
  deposit_cents integer not null default 0,
  notes text,          -- observação do cliente
  internal_notes text, -- observação da equipe
  idempotency_key uuid,
  token_version integer not null default 1,
  hold_expires_at timestamptz,
  cancelled_at timestamptz,
  cancelled_by public.cancel_actor,
  cancel_reason text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint bookings_range check (ends_at > starts_at),
  constraint bookings_buffers check (
    buffer_before_min between 0 and 240 and buffer_after_min between 0 and 240
  ),
  constraint bookings_amounts check (price_cents >= 0 and deposit_cents >= 0),
  constraint bookings_hold check (status <> 'pending_payment' or hold_expires_at is not null),
  constraint bookings_idempotency_key unique (business_id, idempotency_key),

  foreign key (business_id, unit_id) references public.units (business_id, id),
  foreign key (business_id, professional_id) references public.professionals (business_id, id),
  foreign key (business_id, service_id) references public.services (business_id, id),
  foreign key (business_id, client_id) references public.clients (business_id, id),

  -- >>> REGRA CRÍTICA: impossível existir duas reservas ativas sobrepostas
  -- para o mesmo profissional. Vale para qualquer caminho de escrita
  -- (página pública, painel, arrastar e soltar, SQL direto).
  constraint bookings_no_overlap exclude using gist (
    professional_id with =,
    occupied with &&
  ) where (status in ('pending_payment', 'confirmed', 'completed', 'no_show'))
);

create index bookings_business_starts_idx on public.bookings (business_id, starts_at);
create index bookings_professional_starts_idx on public.bookings (professional_id, starts_at);
create index bookings_client_idx on public.bookings (client_id, starts_at desc);
create index bookings_pending_hold_idx on public.bookings (hold_expires_at)
  where status = 'pending_payment';

create trigger bookings_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Pagamentos (sinal)
-- -----------------------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  booking_id uuid not null references public.bookings (id) on delete cascade,
  provider text not null,
  provider_payment_id text,
  method public.payment_method not null,
  amount_cents integer not null,
  status public.payment_status not null default 'pending',
  pix_qr_code text,
  pix_qr_code_base64 text,
  checkout_url text,
  expires_at timestamptz,
  refunded_cents integer not null default 0,
  attempts integer not null default 0,
  last_error text,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_amount check (amount_cents > 0 and refunded_cents >= 0),
  constraint payments_provider_id_key unique (provider, provider_payment_id)
);

create index payments_booking_idx on public.payments (booking_id);
create index payments_refund_idx on public.payments (updated_at) where status = 'refund_pending';

create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Notificações (padrão outbox: gravadas na mesma transação da reserva,
-- enviadas por um worker com tentativas e backoff)
-- -----------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  booking_id uuid references public.bookings (id) on delete cascade,
  channel public.notification_channel not null,
  template text not null,
  recipient text not null,
  payload jsonb not null default '{}'::jsonb,
  scheduled_for timestamptz not null default now(),
  status public.notification_status not null default 'pending',
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  last_error text,
  provider_message_id text,
  dedupe_key text,
  locked_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_dedupe_key unique (dedupe_key)
);

create index notifications_due_idx on public.notifications (scheduled_for)
  where status = 'pending';
create index notifications_business_idx on public.notifications (business_id, created_at desc);
create index notifications_booking_idx on public.notifications (booking_id);

-- -----------------------------------------------------------------------------
-- Auditoria
-- -----------------------------------------------------------------------------
create table public.audit_log (
  id bigint generated always as identity primary key,
  business_id uuid references public.businesses (id) on delete cascade,
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id uuid,
  data jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_business_idx on public.audit_log (business_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Rate limiting (janela fixa). Chaves são hashes; nunca IP em claro (LGPD).
-- -----------------------------------------------------------------------------
create table private.rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (key, window_start)
);
