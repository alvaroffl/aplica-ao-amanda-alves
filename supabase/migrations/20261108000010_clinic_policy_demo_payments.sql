-- =============================================================================
-- Agendaê — Clínica Amanda Alves: política configurável, dados de demonstração,
-- credenciais da profissional e pagamentos (parcelas, modo de teste, reembolso
-- pelo painel e aviso em tempo real do Pix).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Política de remarcação/cancelamento por regra (substitui
--    businesses.cancellation_window_hours, que tinha uma janela única)
-- -----------------------------------------------------------------------------
create table public.booking_policies (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  -- a cliente remarca sozinha até N horas antes
  reschedule_min_hours integer not null default 24,
  -- cancelando até N horas antes, recebe refund_percent% do sinal de volta
  refund_min_hours integer not null default 24,
  refund_percent integer not null default 100,
  client_can_reschedule boolean not null default true,
  client_can_cancel boolean not null default true,
  -- texto livre exibido à cliente (complementa as regras acima)
  notes text,
  is_demo boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint booking_policies_reschedule check (reschedule_min_hours between 0 and 720),
  constraint booking_policies_refund_window check (refund_min_hours between 0 and 720),
  constraint booking_policies_refund_percent check (refund_percent between 0 and 100),
  constraint booking_policies_notes_len check (notes is null or char_length(notes) <= 1000)
);

create trigger booking_policies_updated_at before update on public.booking_policies
  for each row execute function public.set_updated_at();

insert into public.booking_policies (business_id, reschedule_min_hours, refund_min_hours)
select id, cancellation_window_hours, cancellation_window_hours from public.businesses;

alter table public.businesses drop column cancellation_window_hours;

-- Todo negócio novo nasce com a política padrão.
create or replace function private.create_default_policy()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.booking_policies (business_id) values (new.id)
  on conflict (business_id) do nothing;
  return new;
end
$$;

create trigger businesses_default_policy after insert on public.businesses
  for each row execute function private.create_default_policy();

-- Política efetiva (padrão se a linha foi removida, ex.: limpeza dos dados demo).
create or replace function private.policy_for(p_business_id uuid)
returns public.booking_policies
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p from public.booking_policies p where p.business_id = p_business_id),
    row(p_business_id, 24, 24, 100, true, true, null, false, now())::public.booking_policies
  )
$$;

create or replace function private.policy_json(p_business_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select to_jsonb(private.policy_for(p_business_id)) - 'business_id' - 'updated_at' - 'is_demo'
$$;

alter table public.booking_policies enable row level security;

create policy "membros leem a política" on public.booking_policies
  for select to authenticated using (public.is_member(business_id));
create policy "admin cria a política" on public.booking_policies
  for insert to authenticated with check (public.has_role(business_id, '{admin}'));
create policy "admin altera a política" on public.booking_policies
  for update to authenticated
  using (public.has_role(business_id, '{admin}'))
  with check (public.has_role(business_id, '{admin}'));

grant select, insert, update on public.booking_policies to authenticated;

-- -----------------------------------------------------------------------------
-- 2) Configurações de pagamento do negócio e credenciais da profissional
-- -----------------------------------------------------------------------------
alter table public.businesses
  add column max_installments integer not null default 1,
  add column payment_methods text[] not null default '{pix,card}',
  add constraint businesses_max_installments check (max_installments between 1 and 12),
  add constraint businesses_payment_methods check (
    cardinality(payment_methods) >= 1 and payment_methods <@ array['pix', 'card']
  );

-- Opcional e só exibido publicamente quando preenchido.
alter table public.professionals
  add column credentials text,
  add constraint professionals_credentials_len check (
    credentials is null or char_length(credentials) <= 300
  );

-- -----------------------------------------------------------------------------
-- 3) Dados de demonstração (is_demo) — removíveis com purge_demo_data
-- -----------------------------------------------------------------------------
alter table public.services add column is_demo boolean not null default false;
alter table public.availability_rules add column is_demo boolean not null default false;
alter table public.time_off add column is_demo boolean not null default false;
alter table public.clients add column is_demo boolean not null default false;
alter table public.bookings add column is_demo boolean not null default false;

create or replace function public.business_has_demo_data(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_member(p_business_id) and (
    exists (select 1 from public.services where business_id = p_business_id and is_demo)
    or exists (select 1 from public.availability_rules where business_id = p_business_id and is_demo)
    or exists (select 1 from public.time_off where business_id = p_business_id and is_demo)
    or exists (select 1 from public.clients where business_id = p_business_id and is_demo)
    or exists (select 1 from public.bookings where business_id = p_business_id and is_demo)
    or exists (select 1 from public.booking_policies where business_id = p_business_id and is_demo)
  )
$$;

-- Remove tudo que é demonstração. Reservas feitas em serviços de demonstração
-- (testes durante a apresentação) também saem, com os pagamentos de teste.
-- p_business_id nulo = todos os negócios (uso pelo script de linha de comando).
create or replace function private.purge_demo_data(p_business_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_bookings integer;
  v_clients integer;
  v_services integer;
  v_rules integer;
  v_blocks integer;
  v_policies integer;
  v_client_ids uuid[];
begin
  with gone as (
    delete from public.bookings b
    where (p_business_id is null or b.business_id = p_business_id)
      and (b.is_demo or b.service_id in (select id from public.services where is_demo))
    returning b.client_id
  )
  select count(*), array_agg(distinct client_id) into v_bookings, v_client_ids from gone;

  -- clientes de demonstração e quem ficou sem nenhuma reserva após a limpeza
  with gone as (
    delete from public.clients c
    where (p_business_id is null or c.business_id = p_business_id)
      and (c.is_demo or (c.id = any (coalesce(v_client_ids, '{}'))
        and not exists (select 1 from public.bookings b where b.client_id = c.id)))
    returning 1
  )
  select count(*) into v_clients from gone;

  with gone as (
    delete from public.services
    where is_demo and (p_business_id is null or business_id = p_business_id) returning 1
  )
  select count(*) into v_services from gone;

  with gone as (
    delete from public.availability_rules
    where is_demo and (p_business_id is null or business_id = p_business_id) returning 1
  )
  select count(*) into v_rules from gone;

  with gone as (
    delete from public.time_off
    where is_demo and (p_business_id is null or business_id = p_business_id) returning 1
  )
  select count(*) into v_blocks from gone;

  -- a política volta ao padrão (24h, 100%) até a clínica definir a oficial
  with gone as (
    delete from public.booking_policies
    where is_demo and (p_business_id is null or business_id = p_business_id) returning business_id
  ), restored as (
    insert into public.booking_policies (business_id) select business_id from gone returning 1
  )
  select count(*) into v_policies from restored;

  return jsonb_build_object(
    'bookings', v_bookings, 'clients', v_clients, 'services', v_services,
    'availability_rules', v_rules, 'time_off', v_blocks, 'policies', v_policies
  );
end
$$;

create or replace function public.purge_demo_data(p_business_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not public.has_role(p_business_id, '{admin}') then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  v_result := private.purge_demo_data(p_business_id);
  insert into public.audit_log (business_id, actor_id, action, entity, entity_id, data)
  values (p_business_id, auth.uid(), 'demo.purged', 'business', p_business_id, v_result);
  return v_result;
end
$$;

-- -----------------------------------------------------------------------------
-- 4) Pagamentos: modo de teste, detalhe do método, parcelas, reembolso parcial
-- -----------------------------------------------------------------------------
alter table public.payments
  add column test_mode boolean not null default false,
  -- tipo informado pelo provedor: credit_card, debit_card, account_money, bank_transfer…
  add column method_detail text,
  add column installments integer,
  -- valor a estornar quando status = refund_pending (nulo = o que ainda não foi estornado)
  add column refund_requested_cents integer,
  add constraint payments_refund_requested check (
    refund_requested_cents is null or refund_requested_cents > 0
  );

-- Confirmação vinda do webhook (idempotente). Agora também guarda o tipo de
-- cartão/carteira e as parcelas informados pelo provedor.
create or replace function public.confirm_payment(
  p_payment_id uuid,
  p_provider_payment_id text,
  p_raw jsonb default null
)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_pay public.payments%rowtype;
  v_booking public.bookings%rowtype;
begin
  select * into v_pay from public.payments where id = p_payment_id for update;
  if not found then
    raise exception 'PAYMENT_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_pay.status in ('approved', 'refund_pending', 'refunded') then
    return 'already_processed';
  end if;

  update public.payments
  set status = 'approved',
      provider_payment_id = coalesce(p_provider_payment_id, provider_payment_id),
      method_detail = coalesce(p_raw ->> 'payment_type_id', method_detail),
      installments = coalesce((p_raw ->> 'installments')::integer, installments),
      raw = coalesce(p_raw, raw)
  where id = p_payment_id;

  select * into v_booking from public.bookings where id = v_pay.booking_id for update;

  if v_booking.status = 'confirmed' then
    return 'already_processed';
  end if;

  if v_booking.status in ('pending_payment', 'expired') and v_booking.starts_at > now() then
    begin
      update public.bookings
      set status = 'confirmed', hold_expires_at = null
      where id = v_booking.id;
      return 'confirmed';
    exception when exclusion_violation then
      -- pagou depois de expirar e o horário já foi ocupado → estorno automático
      null;
    end;
  end if;

  update public.payments set status = 'refund_pending' where id = p_payment_id;
  return 'refund_required';
end
$$;

create or replace function public.complete_refund(p_payment_id uuid, p_ok boolean, p_error text default null)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.payments
  set status = case when p_ok then 'refunded'::public.payment_status else status end,
      refunded_cents = case when p_ok
        then least(amount_cents, refunded_cents + coalesce(refund_requested_cents, amount_cents - refunded_cents))
        else refunded_cents end,
      refund_requested_cents = case when p_ok then null else refund_requested_cents end,
      last_error = case when p_ok then null else left(p_error, 1000) end
  where id = p_payment_id
$$;

-- Reembolso pelo painel (somente admin). Valor nulo = estorno integral.
create or replace function public.panel_refund_payment(
  p_payment_id uuid, p_amount_cents integer default null
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_pay public.payments%rowtype;
  v_amount integer;
begin
  select * into v_pay from public.payments where id = p_payment_id for update;
  if not found or not public.has_role(v_pay.business_id, '{admin}') then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if v_pay.status <> 'approved' then
    raise exception 'PAYMENT_NOT_REFUNDABLE' using errcode = 'P0001';
  end if;
  v_amount := coalesce(p_amount_cents, v_pay.amount_cents - v_pay.refunded_cents);
  if v_amount < 1 or v_amount > v_pay.amount_cents - v_pay.refunded_cents then
    raise exception 'INVALID_REFUND_AMOUNT' using errcode = 'P0001';
  end if;

  update public.payments
  set status = 'refund_pending', refund_requested_cents = v_amount, attempts = 0, last_error = null
  where id = p_payment_id;

  insert into public.audit_log (business_id, actor_id, action, entity, entity_id, data)
  values (v_pay.business_id, auth.uid(), 'payment.refund_requested', 'payment', p_payment_id,
    jsonb_build_object('amount_cents', v_amount));
end
$$;

-- -----------------------------------------------------------------------------
-- 5) Aviso em tempo real do pagamento (tela do Pix atualiza sozinha)
--    Canal público de Broadcast com nome secreto derivado do link seguro: só
--    quem tem o link recebe o aviso, e o aviso leva apenas o novo status.
-- -----------------------------------------------------------------------------
create or replace function private.booking_realtime_topic(p_booking_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select 'reserva-' || substr(encode(extensions.hmac(
    p_booking_id::text || ':realtime',
    (select s.value from private.settings s where s.key = 'manage_token_secret'),
    'sha256'
  ), 'hex'), 1, 32)
$$;

create or replace function private.payments_broadcast()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  begin
    perform realtime.send(
      jsonb_build_object('status', new.status),
      'payment_status',
      private.booking_realtime_topic(new.booking_id),
      false
    );
  exception when others then
    -- o aviso é só conveniência: a tela também consulta periodicamente
    null;
  end;
  return null;
end
$$;

create trigger payments_broadcast after update of status on public.payments
  for each row when (old.status is distinct from new.status)
  execute function private.payments_broadcast();

-- -----------------------------------------------------------------------------
-- 6) Funções públicas atualizadas (política, parcelas, credenciais, modo de teste)
-- -----------------------------------------------------------------------------
create or replace function public.get_public_business(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'business', jsonb_build_object(
      'id', b.id, 'slug', b.slug, 'name', b.name, 'description', b.description,
      'logo_url', b.logo_url, 'phone', b.phone, 'email', b.email,
      'timezone', b.timezone, 'locale', b.locale, 'currency', b.currency,
      'booking_hold_min', b.booking_hold_min,
      'max_installments', b.max_installments,
      'payment_methods', to_jsonb(b.payment_methods),
      'policy', private.policy_json(b.id)
    ),
    'units', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', u.id, 'name', u.name, 'slug', u.slug, 'address', u.address,
        'phone', u.phone, 'timezone', u.timezone
      ) order by u.name)
      from public.units u where u.business_id = b.id and u.active
    ), '[]'::jsonb),
    'services', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'name', s.name, 'description', s.description, 'category', s.category,
        'duration_min', s.duration_min, 'price_cents', s.price_cents,
        'deposit_type', s.deposit_type, 'deposit_value', s.deposit_value,
        'deposit_cents', public.compute_deposit(s.price_cents, s.deposit_type, s.deposit_value),
        'is_demo', s.is_demo,
        'professional_ids', coalesce((
          select jsonb_agg(sp.professional_id)
          from public.service_professionals sp
          join public.professionals p on p.id = sp.professional_id and p.active
          where sp.service_id = s.id
        ), '[]'::jsonb)
      ) order by s.sort_order, s.name)
      from public.services s where s.business_id = b.id and s.active
    ), '[]'::jsonb),
    'professionals', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'name', p.name, 'bio', p.bio, 'avatar_url', p.avatar_url, 'color', p.color,
        'credentials', nullif(trim(p.credentials), ''),
        'unit_ids', coalesce((
          select jsonb_agg(pu.unit_id) from public.professional_units pu
          where pu.professional_id = p.id
        ), '[]'::jsonb)
      ) order by p.sort_order, p.name)
      from public.professionals p where p.business_id = b.id and p.active
    ), '[]'::jsonb)
  )
  from public.businesses b
  where b.slug = lower(p_slug)
$$;

create or replace function public.booking_public_payload(p_booking_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', b.id,
    'status', b.status,
    'starts_at', b.starts_at,
    'ends_at', b.ends_at,
    'price_cents', b.price_cents,
    'deposit_cents', b.deposit_cents,
    'hold_expires_at', b.hold_expires_at,
    'notes', b.notes,
    'cancelled_at', b.cancelled_at,
    'cancelled_by', b.cancelled_by,
    'manage_token', public.manage_token(b.id),
    'realtime_topic', private.booking_realtime_topic(b.id),
    'business', jsonb_build_object(
      'id', biz.id, 'name', biz.name, 'slug', biz.slug, 'phone', biz.phone,
      'email', biz.email, 'logo_url', biz.logo_url,
      'max_installments', biz.max_installments,
      'policy', private.policy_json(biz.id)
    ),
    'service', jsonb_build_object(
      'id', s.id, 'name', s.name, 'duration_min', s.duration_min
    ),
    'professional', jsonb_build_object('id', p.id, 'name', p.name),
    'unit', jsonb_build_object(
      'id', u.id, 'name', u.name, 'address', u.address, 'timezone', u.timezone
    ),
    'client', jsonb_build_object('name', c.name, 'email', c.email, 'phone', c.phone),
    'payment', (
      select jsonb_build_object(
        'id', pay.id, 'status', pay.status, 'method', pay.method,
        'method_detail', pay.method_detail, 'installments', pay.installments,
        'amount_cents', pay.amount_cents, 'refunded_cents', pay.refunded_cents,
        'pix_qr_code', pay.pix_qr_code,
        'pix_qr_code_base64', pay.pix_qr_code_base64, 'checkout_url', pay.checkout_url,
        'expires_at', pay.expires_at, 'provider', pay.provider,
        'provider_payment_id', pay.provider_payment_id, 'test_mode', pay.test_mode,
        'updated_at', pay.updated_at
      )
      from public.payments pay
      where pay.booking_id = b.id
      order by pay.created_at desc
      limit 1
    )
  )
  from public.bookings b
  join public.businesses biz on biz.id = b.business_id
  join public.services s on s.id = b.service_id
  join public.professionals p on p.id = b.professional_id
  join public.units u on u.id = b.unit_id
  join public.clients c on c.id = b.client_id
  where b.id = p_booking_id
$$;

create or replace function public.get_booking_by_token(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_id uuid := public.booking_id_from_token(p_token);
  v_booking public.bookings%rowtype;
  v_policy public.booking_policies;
  v_reschedule_deadline timestamptz;
  v_refund_deadline timestamptz;
  v_active boolean;
begin
  if v_id is null then
    return null;
  end if;
  select * into v_booking from public.bookings where id = v_id;
  v_policy := private.policy_for(v_booking.business_id);
  v_reschedule_deadline := v_booking.starts_at - make_interval(hours => v_policy.reschedule_min_hours);
  v_refund_deadline := v_booking.starts_at - make_interval(hours => v_policy.refund_min_hours);
  v_active := v_booking.status in ('pending_payment', 'confirmed') and v_booking.starts_at > now();

  return public.booking_public_payload(v_id) || jsonb_build_object(
    'policy', jsonb_build_object(
      'reschedule_deadline', v_reschedule_deadline,
      'refund_deadline', v_refund_deadline,
      'refund_percent', v_policy.refund_percent,
      'can_cancel', v_active
        and (v_policy.client_can_cancel or v_booking.status = 'pending_payment'),
      'can_reschedule', v_policy.client_can_reschedule
        and v_booking.status = 'confirmed' and now() <= v_reschedule_deadline,
      'refund_eligible', v_policy.refund_percent > 0 and now() <= v_refund_deadline
    )
  );
end
$$;

create or replace function public.reschedule_booking_by_token(p_token text, p_starts_at timestamptz)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id uuid := public.booking_id_from_token(p_token);
  v_booking public.bookings%rowtype;
  v_policy public.booking_policies;
  v_tz text;
  v_local_date date;
begin
  if v_id is null then
    raise exception 'INVALID_TOKEN' using errcode = '28000';
  end if;

  select * into v_booking from public.bookings where id = v_id for update;
  v_policy := private.policy_for(v_booking.business_id);

  if v_booking.status <> 'confirmed' then
    raise exception 'BOOKING_NOT_ACTIVE' using errcode = 'P0001';
  end if;
  if not v_policy.client_can_reschedule
    or now() > v_booking.starts_at - make_interval(hours => v_policy.reschedule_min_hours) then
    raise exception 'OUTSIDE_POLICY_WINDOW' using errcode = 'P0001';
  end if;

  select timezone into v_tz from public.units where id = v_booking.unit_id;
  v_local_date := (p_starts_at at time zone v_tz)::date;

  if not exists (
    select 1 from public.get_available_slots(
      v_booking.service_id, v_booking.unit_id, v_local_date, v_local_date,
      v_booking.professional_id, v_booking.id
    ) s
    where s.starts_at = p_starts_at
  ) then
    raise exception 'SLOT_UNAVAILABLE' using errcode = 'P0001';
  end if;

  begin
    update public.bookings
    set starts_at = p_starts_at,
        ends_at = p_starts_at + (v_booking.ends_at - v_booking.starts_at)
    where id = v_id;
  exception when exclusion_violation then
    raise exception 'SLOT_UNAVAILABLE' using errcode = 'P0001';
  end;

  insert into public.audit_log (business_id, action, entity, entity_id, data)
  values (v_booking.business_id, 'booking.rescheduled_by_client', 'booking', v_id,
    jsonb_build_object('from', v_booking.starts_at, 'to', p_starts_at));

  return public.get_booking_by_token(p_token);
end
$$;

-- Cancelamento pela cliente. A política define se ela pode cancelar sozinha
-- (pré-reservas aguardando sinal sempre podem) e quanto do sinal volta.
create or replace function public.cancel_booking_by_token(p_token text, p_reason text default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id uuid := public.booking_id_from_token(p_token);
  v_booking public.bookings%rowtype;
  v_policy public.booking_policies;
  v_in_window boolean;
  v_refund boolean := false;
  v_pay public.payments%rowtype;
  v_refund_cents integer;
begin
  if v_id is null then
    raise exception 'INVALID_TOKEN' using errcode = '28000';
  end if;

  select * into v_booking from public.bookings where id = v_id for update;
  if v_booking.status not in ('pending_payment', 'confirmed') or v_booking.starts_at <= now() then
    raise exception 'BOOKING_NOT_ACTIVE' using errcode = 'P0001';
  end if;

  v_policy := private.policy_for(v_booking.business_id);
  if v_booking.status = 'confirmed' and not v_policy.client_can_cancel then
    raise exception 'CANCEL_NOT_ALLOWED' using errcode = 'P0001';
  end if;
  v_in_window := now() <= v_booking.starts_at - make_interval(hours => v_policy.refund_min_hours);
  -- refund = a política dá direito a reembolso (mesmo sem sinal pago)
  v_refund := v_in_window and v_policy.refund_percent > 0;

  update public.bookings
  set status = 'cancelled', cancelled_at = now(), cancelled_by = 'client',
      cancel_reason = left(nullif(trim(p_reason), ''), 500)
  where id = v_id;

  for v_pay in select * from public.payments where booking_id = v_id for update loop
    if v_pay.status = 'pending' then
      update public.payments set status = 'cancelled' where id = v_pay.id;
    elsif v_pay.status = 'approved' and v_in_window then
      v_refund_cents := round((v_pay.amount_cents - v_pay.refunded_cents) * v_policy.refund_percent / 100.0);
      if v_refund_cents > 0 then
        update public.payments
        set status = 'refund_pending', refund_requested_cents = v_refund_cents
        where id = v_pay.id;
      end if;
    end if;
  end loop;

  return public.get_booking_by_token(p_token) || jsonb_build_object('refund', v_refund);
end
$$;

-- -----------------------------------------------------------------------------
-- Permissões
-- -----------------------------------------------------------------------------
grant execute on function public.business_has_demo_data(uuid) to authenticated, service_role;
grant execute on function public.purge_demo_data(uuid) to authenticated, service_role;
grant execute on function public.panel_refund_payment(uuid, integer) to authenticated, service_role;
