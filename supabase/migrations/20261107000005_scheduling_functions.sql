-- =============================================================================
-- 0005 · Motor de agenda: horários livres, criação idempotente de reservas,
--        links seguros (token HMAC), reagendamento e cancelamento.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Horários livres
-- Regras semanais são horários LOCAIS da unidade; a expansão para UTC é feita
-- por data com AT TIME ZONE (correto inclusive em horário de verão).
-- Expõe apenas intervalos livres — nunca dados de outras reservas.
-- -----------------------------------------------------------------------------
create or replace function public.get_available_slots(
  p_service_id uuid,
  p_unit_id uuid,
  p_from date,
  p_to date,
  p_professional_id uuid default null,
  p_ignore_booking_id uuid default null
)
returns table (professional_id uuid, starts_at timestamptz, ends_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_service public.services%rowtype;
  v_unit public.units%rowtype;
  v_business public.businesses%rowtype;
  v_duration interval;
  v_step interval;
  v_min_start timestamptz;
  v_max_start timestamptz;
begin
  if p_from is null or p_to is null or p_to < p_from or p_to - p_from > 62 then
    raise exception 'INVALID_RANGE' using errcode = '22023';
  end if;

  select * into v_service from public.services s where s.id = p_service_id and s.active;
  if not found then
    return;
  end if;

  select * into v_unit from public.units u
  where u.id = p_unit_id and u.business_id = v_service.business_id and u.active;
  if not found then
    return;
  end if;

  select * into v_business from public.businesses b where b.id = v_service.business_id;

  v_duration := make_interval(mins => v_service.duration_min);
  v_step := make_interval(mins => v_business.slot_interval_min);
  v_min_start := now() + make_interval(mins => v_service.min_notice_min);
  v_max_start := now() + make_interval(days => v_service.max_advance_days);

  return query
  with pros as (
    select p.id
    from public.professionals p
    join public.service_professionals sp
      on sp.professional_id = p.id and sp.service_id = v_service.id
    join public.professional_units pu
      on pu.professional_id = p.id and pu.unit_id = v_unit.id
    where p.active
      and p.business_id = v_service.business_id
      and (p_professional_id is null or p.id = p_professional_id)
  ),
  days as (
    select d::date as day
    from generate_series(p_from::timestamp, p_to::timestamp, interval '1 day') d
  ),
  windows as (
    select
      r.professional_id as pro_id,
      (dy.day + r.start_time) at time zone v_unit.timezone as w_start,
      (dy.day + r.end_time) at time zone v_unit.timezone as w_end
    from days dy
    join public.availability_rules r
      on r.weekday = extract(dow from dy.day)::int and r.unit_id = v_unit.id
    join pros on pros.id = r.professional_id
    where not exists (
      select 1 from public.holidays h
      where h.business_id = v_service.business_id
        and h.date = dy.day
        and (h.unit_id is null or h.unit_id = v_unit.id)
    )
  ),
  candidates as (
    select w.pro_id, s as c_start, s + v_duration as c_end
    from windows w
    cross join lateral generate_series(w.w_start, w.w_end - v_duration, v_step) s
  )
  select c.pro_id, c.c_start, c.c_end
  from candidates c
  where c.c_start >= v_min_start
    and c.c_start <= v_max_start
    and not exists (
      select 1 from public.bookings b
      where b.professional_id = c.pro_id
        and b.status in ('pending_payment', 'confirmed', 'completed', 'no_show')
        and (b.status <> 'pending_payment' or b.hold_expires_at > now())
        and (p_ignore_booking_id is null or b.id <> p_ignore_booking_id)
        and b.occupied && tstzrange(
          public.add_minutes(c.c_start, -v_service.buffer_before_min),
          public.add_minutes(c.c_end, v_service.buffer_after_min),
          '[)'
        )
    )
    and not exists (
      select 1 from public.time_off t
      where t.professional_id = c.pro_id
        and t.starts_at < c.c_end
        and t.ends_at > c.c_start
    )
  order by c.c_start, c.pro_id;
end
$$;

grant execute on function public.get_available_slots(uuid, uuid, date, date, uuid, uuid)
  to anon, authenticated, service_role;

-- Valor do sinal em centavos.
create or replace function public.compute_deposit(
  p_price_cents integer, p_type public.deposit_type, p_value integer
)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case p_type
    when 'fixed' then least(p_value, p_price_cents)
    when 'percent' then round(p_price_cents * p_value / 100.0)::integer
    else 0
  end
$$;

-- -----------------------------------------------------------------------------
-- Dados públicos da página de reserva (/:slug)
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
      'cancellation_window_hours', b.cancellation_window_hours,
      'booking_hold_min', b.booking_hold_min
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

-- -----------------------------------------------------------------------------
-- Regras de negócio auxiliares
-- -----------------------------------------------------------------------------

-- (permissões de get_public_business/compute_deposit)
grant execute on function public.get_public_business(text) to anon, authenticated, service_role;
grant execute on function public.compute_deposit(integer, public.deposit_type, integer)
  to anon, authenticated, service_role;

-- Normaliza e-mail; telefone já chega em E.164 (validado com Zod no servidor).
create or replace function public.upsert_client(
  p_business_id uuid,
  p_name text,
  p_email text,
  p_phone text,
  p_consent_version text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_email text := nullif(lower(trim(p_email)), '');
  v_phone text := nullif(trim(p_phone), '');
begin
  if v_email is not null then
    select id into v_id from public.clients
    where business_id = p_business_id and email = v_email and anonymized_at is null;
  end if;
  if v_id is null and v_phone is not null then
    select id into v_id from public.clients
    where business_id = p_business_id and phone = v_phone and anonymized_at is null
    order by created_at
    limit 1;
  end if;

  if v_id is null then
    insert into public.clients (business_id, name, email, phone, consent_at, consent_version)
    values (
      p_business_id, trim(p_name), v_email, v_phone,
      case when p_consent_version is not null then now() end, p_consent_version
    )
    returning id into v_id;
  else
    -- nunca sobrescreve dados existentes (evita que terceiros alterem o cadastro);
    -- apenas completa campos vazios e renova o consentimento.
    update public.clients c set
      email = coalesce(c.email, v_email),
      phone = coalesce(c.phone, v_phone),
      consent_at = case when p_consent_version is not null then now() else c.consent_at end,
      consent_version = coalesce(p_consent_version, c.consent_version)
    where c.id = v_id;
  end if;

  return v_id;
end
$$;

-- Libera pré-reservas cujo prazo de pagamento venceu.
create or replace function public.expire_pending_bookings()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  with expired as (
    update public.bookings
    set status = 'expired'
    where status = 'pending_payment' and hold_expires_at <= now()
    returning id
  ), pays as (
    update public.payments p
    set status = 'expired'
    from expired e
    where p.booking_id = e.id and p.status = 'pending'
    returning p.id
  )
  select count(*) into v_count from expired;
  return v_count;
end
$$;

-- -----------------------------------------------------------------------------
-- Token de gerenciamento (link seguro): <uuid sem hífens>.<HMAC-SHA256 truncado>
-- Determinístico (permite reenvio idempotente) e revogável (token_version).
-- -----------------------------------------------------------------------------
create or replace function public.manage_token(p_booking_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select replace(b.id::text, '-', '') || '.' || substr(encode(extensions.hmac(
    b.id::text || ':' || b.token_version::text,
    (select s.value from private.settings s where s.key = 'manage_token_secret'),
    'sha256'
  ), 'hex'), 1, 32)
  from public.bookings b
  where b.id = p_booking_id
$$;

create or replace function public.booking_id_from_token(p_token text)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_hex text;
  v_id uuid;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{32}\.[0-9a-f]{32}$' then
    return null;
  end if;
  v_hex := split_part(p_token, '.', 1);
  v_id := (
    substr(v_hex, 1, 8) || '-' || substr(v_hex, 9, 4) || '-' || substr(v_hex, 13, 4) || '-' ||
    substr(v_hex, 17, 4) || '-' || substr(v_hex, 21, 12)
  )::uuid;
  if public.manage_token(v_id) = p_token then
    return v_id;
  end if;
  return null;
end
$$;

-- Resumo público de uma reserva (usado no retorno da criação e no link seguro).
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
    'business', jsonb_build_object(
      'id', biz.id, 'name', biz.name, 'slug', biz.slug, 'phone', biz.phone,
      'email', biz.email, 'logo_url', biz.logo_url,
      'cancellation_window_hours', biz.cancellation_window_hours
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
        'amount_cents', pay.amount_cents, 'pix_qr_code', pay.pix_qr_code,
        'pix_qr_code_base64', pay.pix_qr_code_base64, 'checkout_url', pay.checkout_url,
        'expires_at', pay.expires_at, 'provider', pay.provider
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

-- -----------------------------------------------------------------------------
-- Criação de reserva pública: transacional e idempotente.
-- Chamada SOMENTE pelo backend (Edge Function public-booking), depois de
-- captcha, rate limit e validação Zod.
-- -----------------------------------------------------------------------------
create or replace function public.create_booking(
  p_service_id uuid,
  p_unit_id uuid,
  p_professional_id uuid,
  p_starts_at timestamptz,
  p_client_name text,
  p_client_email text,
  p_client_phone text,
  p_notes text,
  p_idempotency_key uuid,
  p_consent_version text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_service public.services%rowtype;
  v_business public.businesses%rowtype;
  v_unit public.units%rowtype;
  v_existing_id uuid;
  v_booking_id uuid;
  v_client_id uuid;
  v_candidate uuid;
  v_deposit integer;
  v_local_date date;
  v_status public.booking_status;
begin
  select * into v_service from public.services where id = p_service_id and active;
  if not found then
    raise exception 'SERVICE_NOT_FOUND' using errcode = 'P0002';
  end if;
  select * into v_business from public.businesses where id = v_service.business_id;

  -- 1) Idempotência: mesma chave → mesma reserva
  if p_idempotency_key is not null then
    select id into v_existing_id from public.bookings
    where business_id = v_business.id and idempotency_key = p_idempotency_key;
    if found then
      return public.booking_public_payload(v_existing_id) || '{"replayed": true}'::jsonb;
    end if;
  end if;

  select * into v_unit from public.units
  where id = p_unit_id and business_id = v_business.id and active;
  if not found then
    raise exception 'UNIT_NOT_FOUND' using errcode = 'P0002';
  end if;

  -- 2) Libera pré-reservas vencidas antes de validar o horário
  perform public.expire_pending_bookings();

  v_local_date := (p_starts_at at time zone v_unit.timezone)::date;
  v_client_id := public.upsert_client(
    v_business.id, p_client_name, p_client_email, p_client_phone, p_consent_version
  );
  v_deposit := public.compute_deposit(
    v_service.price_cents, v_service.deposit_type, v_service.deposit_value
  );
  v_status := case when v_deposit > 0 then 'pending_payment' else 'confirmed' end;

  -- 3) Tenta cada profissional livre naquele horário (menos carregado primeiro).
  --    A exclusion constraint é a garantia final contra corrida.
  for v_candidate in
    select s.professional_id
    from public.get_available_slots(
      p_service_id, p_unit_id, v_local_date, v_local_date, p_professional_id
    ) s
    left join lateral (
      select count(*) as n from public.bookings b
      where b.professional_id = s.professional_id
        and b.status in ('confirmed', 'pending_payment')
        and b.starts_at >= (v_local_date::timestamp at time zone v_unit.timezone)
        and b.starts_at < ((v_local_date + 1)::timestamp at time zone v_unit.timezone)
    ) load on true
    where s.starts_at = p_starts_at
    order by load.n, random()
  loop
    begin
      insert into public.bookings (
        business_id, unit_id, professional_id, service_id, client_id,
        starts_at, ends_at, buffer_before_min, buffer_after_min,
        status, source, price_cents, deposit_cents, notes, idempotency_key, hold_expires_at
      ) values (
        v_business.id, v_unit.id, v_candidate, v_service.id, v_client_id,
        p_starts_at, p_starts_at + make_interval(mins => v_service.duration_min),
        v_service.buffer_before_min, v_service.buffer_after_min,
        v_status, 'public', v_service.price_cents, v_deposit, nullif(trim(p_notes), ''),
        p_idempotency_key,
        case when v_status = 'pending_payment'
          then now() + make_interval(mins => v_business.booking_hold_min) end
      )
      returning id into v_booking_id;
      exit;
    exception
      when exclusion_violation then
        v_booking_id := null; -- outro cliente levou este profissional; tenta o próximo
      when unique_violation then
        -- requisição duplicada concorrente com a mesma chave de idempotência
        select id into v_existing_id from public.bookings
        where business_id = v_business.id and idempotency_key = p_idempotency_key;
        if found then
          return public.booking_public_payload(v_existing_id) || '{"replayed": true}'::jsonb;
        end if;
        raise;
    end;
  end loop;

  if v_booking_id is null then
    raise exception 'SLOT_UNAVAILABLE' using errcode = 'P0001';
  end if;

  return public.booking_public_payload(v_booking_id) || '{"replayed": false}'::jsonb;
end
$$;

-- -----------------------------------------------------------------------------
-- Link seguro: consultar, reagendar, cancelar (anônimo, com token)
-- -----------------------------------------------------------------------------
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
  v_window integer;
  v_deadline timestamptz;
begin
  if v_id is null then
    return null;
  end if;
  select * into v_booking from public.bookings where id = v_id;
  select cancellation_window_hours into v_window
  from public.businesses where id = v_booking.business_id;
  v_deadline := v_booking.starts_at - make_interval(hours => v_window);

  return public.booking_public_payload(v_id) || jsonb_build_object(
    'policy', jsonb_build_object(
      'deadline', v_deadline,
      'can_cancel', v_booking.status in ('pending_payment', 'confirmed')
        and v_booking.starts_at > now(),
      'can_reschedule', v_booking.status = 'confirmed' and now() <= v_deadline,
      'refund_eligible', now() <= v_deadline
    )
  );
end
$$;

create or replace function public.get_reschedule_slots(p_token text, p_from date, p_to date)
returns table (starts_at timestamptz, ends_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_id uuid := public.booking_id_from_token(p_token);
  v_booking public.bookings%rowtype;
begin
  if v_id is null then
    raise exception 'INVALID_TOKEN' using errcode = '28000';
  end if;
  select * into v_booking from public.bookings where id = v_id;
  return query
  select s.starts_at, s.ends_at
  from public.get_available_slots(
    v_booking.service_id, v_booking.unit_id, p_from, p_to,
    v_booking.professional_id, v_booking.id
  ) s;
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
  v_window integer;
  v_tz text;
  v_local_date date;
begin
  if v_id is null then
    raise exception 'INVALID_TOKEN' using errcode = '28000';
  end if;

  select * into v_booking from public.bookings where id = v_id for update;
  select cancellation_window_hours into v_window
  from public.businesses where id = v_booking.business_id;

  if v_booking.status <> 'confirmed' then
    raise exception 'BOOKING_NOT_ACTIVE' using errcode = 'P0001';
  end if;
  if now() > v_booking.starts_at - make_interval(hours => v_window) then
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

-- Cancelamento é sempre permitido antes do horário; o que a política define é
-- se o sinal é estornado (dentro do prazo) ou retido (fora do prazo).
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
  v_window integer;
  v_refund boolean;
begin
  if v_id is null then
    raise exception 'INVALID_TOKEN' using errcode = '28000';
  end if;

  select * into v_booking from public.bookings where id = v_id for update;
  if v_booking.status not in ('pending_payment', 'confirmed') or v_booking.starts_at <= now() then
    raise exception 'BOOKING_NOT_ACTIVE' using errcode = 'P0001';
  end if;

  select cancellation_window_hours into v_window
  from public.businesses where id = v_booking.business_id;
  v_refund := now() <= v_booking.starts_at - make_interval(hours => v_window);

  update public.bookings
  set status = 'cancelled', cancelled_at = now(), cancelled_by = 'client',
      cancel_reason = left(nullif(trim(p_reason), ''), 500)
  where id = v_id;

  update public.payments
  set status = case
    when status = 'approved' and v_refund then 'refund_pending'::public.payment_status
    when status = 'pending' then 'cancelled'::public.payment_status
    else status end
  where booking_id = v_id;

  return public.get_booking_by_token(p_token) || jsonb_build_object('refund', v_refund);
end
$$;

-- -----------------------------------------------------------------------------
-- Permissões
-- -----------------------------------------------------------------------------
grant execute on function public.get_booking_by_token(text) to anon, authenticated, service_role;
grant execute on function public.get_reschedule_slots(text, date, date) to anon, authenticated, service_role;
grant execute on function public.reschedule_booking_by_token(text, timestamptz) to anon, authenticated, service_role;
grant execute on function public.cancel_booking_by_token(text, text) to anon, authenticated, service_role;

-- somente backend
grant execute on function public.create_booking(uuid, uuid, uuid, timestamptz, text, text, text, text, uuid, text) to service_role;
grant execute on function public.expire_pending_bookings() to service_role;
grant execute on function public.booking_public_payload(uuid) to service_role;
grant execute on function public.manage_token(uuid) to service_role;
grant execute on function public.booking_id_from_token(text) to service_role;
grant execute on function public.upsert_client(uuid, text, text, text, text) to service_role;
