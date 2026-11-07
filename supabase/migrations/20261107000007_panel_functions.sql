-- =============================================================================
-- 0007 · Funções do painel: onboarding, equipe, reservas manuais,
--        relatórios e LGPD (exportação e anonimização)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Onboarding: cria negócio + unidade + vínculo admin (+ profissional opcional)
-- -----------------------------------------------------------------------------
create or replace function public.create_business(
  p_name text,
  p_slug text,
  p_timezone text default 'America/Sao_Paulo',
  p_unit_name text default 'Principal',
  p_owner_is_professional boolean default true,
  p_owner_name text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_business_id uuid;
  v_unit_id uuid;
  v_pro_id uuid;
  v_owner_name text;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '28000';
  end if;

  insert into public.businesses (name, slug, timezone)
  values (trim(p_name), lower(trim(p_slug)), p_timezone)
  returning id into v_business_id;

  insert into public.units (business_id, name, slug, timezone)
  values (v_business_id, coalesce(nullif(trim(p_unit_name), ''), 'Principal'), 'principal', p_timezone)
  returning id into v_unit_id;

  insert into public.business_members (business_id, user_id, role)
  values (v_business_id, v_uid, 'admin');

  if p_owner_is_professional then
    select coalesce(nullif(trim(p_owner_name), ''), nullif(full_name, ''), split_part(email, '@', 1))
    into v_owner_name from public.profiles where id = v_uid;

    insert into public.professionals (business_id, user_id, name)
    values (v_business_id, v_uid, coalesce(v_owner_name, 'Eu'))
    returning id into v_pro_id;

    insert into public.professional_units (business_id, professional_id, unit_id)
    values (v_business_id, v_pro_id, v_unit_id);
  end if;

  return v_business_id;
end
$$;

-- Convite: adiciona direto se a pessoa já tem conta; senão cria convite pendente.
create or replace function public.invite_member(
  p_business_id uuid,
  p_email text,
  p_role public.member_role,
  p_professional_id uuid default null
)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(p_email));
  v_user uuid;
begin
  if not public.has_role(p_business_id, '{admin}') then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  select id into v_user from public.profiles where email = v_email;

  if v_user is not null then
    insert into public.business_members (business_id, user_id, role)
    values (p_business_id, v_user, p_role)
    on conflict (business_id, user_id) do update set role = excluded.role;
    if p_professional_id is not null then
      update public.professionals set user_id = v_user
      where id = p_professional_id and business_id = p_business_id;
    end if;
    return 'added';
  end if;

  insert into public.invitations (business_id, email, role, professional_id, invited_by)
  values (p_business_id, v_email, p_role, p_professional_id, auth.uid())
  on conflict (business_id, email) where accepted_at is null
  do update set role = excluded.role, professional_id = excluded.professional_id;

  insert into public.notifications (business_id, channel, template, recipient, payload, dedupe_key)
  values (
    p_business_id, 'email', 'member_invite', v_email,
    jsonb_build_object('role', p_role),
    'invite:' || p_business_id || ':' || v_email || ':' || extract(epoch from now())::bigint
  );
  return 'invited';
end
$$;

-- -----------------------------------------------------------------------------
-- Reserva manual (balcão/telefone). Permite encaixe fora da disponibilidade,
-- mas NUNCA sobreposição (a exclusion constraint continua valendo).
-- -----------------------------------------------------------------------------
create or replace function public.panel_create_booking(
  p_business_id uuid,
  p_service_id uuid,
  p_unit_id uuid,
  p_professional_id uuid,
  p_starts_at timestamptz,
  p_client_id uuid default null,
  p_client_name text default null,
  p_client_email text default null,
  p_client_phone text default null,
  p_internal_notes text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_service public.services%rowtype;
  v_client_id uuid := p_client_id;
  v_id uuid;
begin
  if not public.can_manage_professional(p_business_id, p_professional_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  select * into v_service from public.services
  where id = p_service_id and business_id = p_business_id;
  if not found then
    raise exception 'SERVICE_NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_client_id is null then
    if coalesce(trim(p_client_name), '') = '' then
      raise exception 'CLIENT_REQUIRED' using errcode = '22023';
    end if;
    v_client_id := public.upsert_client(p_business_id, p_client_name, p_client_email, p_client_phone, null);
  elsif not exists (select 1 from public.clients where id = v_client_id and business_id = p_business_id) then
    raise exception 'CLIENT_NOT_FOUND' using errcode = 'P0002';
  end if;

  begin
    insert into public.bookings (
      business_id, unit_id, professional_id, service_id, client_id,
      starts_at, ends_at, buffer_before_min, buffer_after_min,
      status, source, price_cents, deposit_cents, internal_notes, created_by
    ) values (
      p_business_id, p_unit_id, p_professional_id, p_service_id, v_client_id,
      p_starts_at, p_starts_at + make_interval(mins => v_service.duration_min),
      v_service.buffer_before_min, v_service.buffer_after_min,
      'confirmed', 'panel', v_service.price_cents, 0, nullif(trim(p_internal_notes), ''), auth.uid()
    )
    returning id into v_id;
  exception when exclusion_violation then
    raise exception 'SLOT_UNAVAILABLE' using errcode = 'P0001';
  end;

  return v_id;
end
$$;

-- Cancelamento pela equipe: sinal é estornado por padrão (iniciativa do negócio).
create or replace function public.panel_cancel_booking(
  p_booking_id uuid, p_reason text default null, p_refund boolean default true
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_b public.bookings%rowtype;
begin
  select * into v_b from public.bookings where id = p_booking_id for update;
  if not found or not public.can_manage_professional(v_b.business_id, v_b.professional_id) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if v_b.status not in ('pending_payment', 'confirmed') then
    raise exception 'BOOKING_NOT_ACTIVE' using errcode = 'P0001';
  end if;

  update public.bookings
  set status = 'cancelled', cancelled_at = now(), cancelled_by = 'business',
      cancel_reason = left(nullif(trim(p_reason), ''), 500)
  where id = p_booking_id;

  update public.payments
  set status = case
    when status = 'approved' and p_refund then 'refund_pending'::public.payment_status
    when status = 'pending' then 'cancelled'::public.payment_status
    else status end
  where booking_id = p_booking_id;
end
$$;

-- -----------------------------------------------------------------------------
-- Relatórios
-- Ocupação = minutos reservados / minutos disponíveis (regras − feriados − folgas)
-- -----------------------------------------------------------------------------
create or replace function public.report_summary(
  p_business_id uuid,
  p_from date,
  p_to date,
  p_professional_id uuid default null,
  p_unit_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_tz text;
  v_from timestamptz;
  v_to timestamptz;
  v_result jsonb;
begin
  if not public.has_role(p_business_id, '{admin,reception}') then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_to < p_from or p_to - p_from > 366 then
    raise exception 'INVALID_RANGE' using errcode = '22023';
  end if;

  select timezone into v_tz from public.businesses where id = p_business_id;
  v_from := p_from::timestamp at time zone v_tz;
  v_to := (p_to + 1)::timestamp at time zone v_tz;

  with b as (
    select bk.*, s.name as service_name
    from public.bookings bk
    join public.services s on s.id = bk.service_id
    where bk.business_id = p_business_id
      and bk.starts_at >= v_from and bk.starts_at < v_to
      and (p_professional_id is null or bk.professional_id = p_professional_id)
      and (p_unit_id is null or bk.unit_id = p_unit_id)
  ),
  avail as (
    select coalesce(sum(extract(epoch from (r.end_time - r.start_time)) / 60), 0) as minutes
    from generate_series(p_from::timestamp, p_to::timestamp, interval '1 day') d
    join public.availability_rules r on r.weekday = extract(dow from d)::int
    join public.professionals p on p.id = r.professional_id and p.active
    where r.business_id = p_business_id
      and (p_professional_id is null or r.professional_id = p_professional_id)
      and (p_unit_id is null or r.unit_id = p_unit_id)
      and not exists (
        select 1 from public.holidays h
        where h.business_id = p_business_id and h.date = d::date
          and (h.unit_id is null or h.unit_id = r.unit_id)
      )
  ),
  off as (
    select coalesce(sum(extract(epoch from (least(t.ends_at, v_to) - greatest(t.starts_at, v_from))) / 60), 0) as minutes
    from public.time_off t
    where t.business_id = p_business_id
      and t.starts_at < v_to and t.ends_at > v_from
      and (p_professional_id is null or t.professional_id = p_professional_id)
  ),
  totals as (
    select
      count(*) filter (where status in ('confirmed', 'completed', 'no_show', 'cancelled')) as total,
      count(*) filter (where status = 'confirmed') as confirmed,
      count(*) filter (where status = 'completed') as completed,
      count(*) filter (where status = 'no_show') as no_show,
      count(*) filter (where status = 'cancelled') as cancelled,
      coalesce(sum(price_cents) filter (where status = 'completed'), 0) as revenue_realized,
      coalesce(sum(price_cents) filter (where status = 'confirmed'), 0) as revenue_expected,
      coalesce(sum(extract(epoch from (ends_at - starts_at)) / 60)
        filter (where status in ('confirmed', 'completed', 'no_show')), 0) as booked_minutes
    from b
  )
  select jsonb_build_object(
    'total', t.total,
    'confirmed', t.confirmed,
    'completed', t.completed,
    'no_show', t.no_show,
    'cancelled', t.cancelled,
    'no_show_rate', case when (t.completed + t.no_show) > 0
      then round(t.no_show::numeric / (t.completed + t.no_show), 4) else 0 end,
    'revenue_realized_cents', t.revenue_realized,
    'revenue_expected_cents', t.revenue_expected,
    'deposits_cents', (
      select coalesce(sum(pay.amount_cents - pay.refunded_cents), 0)
      from public.payments pay join b on b.id = pay.booking_id
      where pay.status in ('approved', 'refund_pending', 'refunded')
    ),
    'booked_minutes', t.booked_minutes,
    'available_minutes', greatest((select minutes from avail) - (select minutes from off), 0),
    'occupancy_rate', case when greatest((select minutes from avail) - (select minutes from off), 0) > 0
      then round(t.booked_minutes::numeric / ((select minutes from avail) - (select minutes from off)), 4)
      else 0 end,
    'top_services', coalesce((
      select jsonb_agg(x order by x.count desc, x.name)
      from (
        select service_id as id, service_name as name, count(*) as count,
          coalesce(sum(price_cents) filter (where status = 'completed'), 0) as revenue_cents
        from b where status in ('confirmed', 'completed', 'no_show')
        group by service_id, service_name
        order by count(*) desc
        limit 10
      ) x
    ), '[]'::jsonb),
    'by_day', coalesce((
      select jsonb_agg(y order by y.day)
      from (
        select (starts_at at time zone v_tz)::date as day,
          count(*) filter (where status in ('confirmed', 'completed')) as bookings,
          count(*) filter (where status = 'no_show') as no_show,
          coalesce(sum(price_cents) filter (where status = 'completed'), 0) as revenue_cents
        from b
        group by 1
      ) y
    ), '[]'::jsonb)
  )
  into v_result
  from totals t;

  return v_result;
end
$$;

-- -----------------------------------------------------------------------------
-- LGPD
-- -----------------------------------------------------------------------------
create or replace function public.lgpd_export_client_data(p_client_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'exported_at', now(),
    'controller', jsonb_build_object('name', biz.name, 'email', biz.email, 'phone', biz.phone),
    'client', jsonb_build_object(
      'name', c.name, 'email', c.email, 'phone', c.phone,
      'consent_at', c.consent_at, 'consent_version', c.consent_version,
      'created_at', c.created_at
    ),
    'bookings', coalesce((
      select jsonb_agg(jsonb_build_object(
        'service', s.name, 'professional', p.name, 'unit', u.name,
        'starts_at', bk.starts_at, 'ends_at', bk.ends_at, 'status', bk.status,
        'price_cents', bk.price_cents, 'notes', bk.notes, 'created_at', bk.created_at,
        'payments', coalesce((
          select jsonb_agg(jsonb_build_object(
            'method', pay.method, 'amount_cents', pay.amount_cents,
            'status', pay.status, 'created_at', pay.created_at
          )) from public.payments pay where pay.booking_id = bk.id
        ), '[]'::jsonb)
      ) order by bk.starts_at desc)
      from public.bookings bk
      join public.services s on s.id = bk.service_id
      join public.professionals p on p.id = bk.professional_id
      join public.units u on u.id = bk.unit_id
      where bk.client_id = c.id
    ), '[]'::jsonb),
    'notifications', coalesce((
      select jsonb_agg(jsonb_build_object(
        'channel', n.channel, 'template', n.template, 'status', n.status, 'sent_at', n.sent_at
      ))
      from public.notifications n join public.bookings bk on bk.id = n.booking_id
      where bk.client_id = c.id
    ), '[]'::jsonb)
  )
  from public.clients c
  join public.businesses biz on biz.id = c.business_id
  where c.id = p_client_id
$$;

-- Anonimiza: remove dados pessoais, mantém números agregados (relatórios).
create or replace function public.lgpd_anonymize(p_client_id uuid, p_actor text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_c public.clients%rowtype;
begin
  select * into v_c from public.clients where id = p_client_id for update;
  if not found or v_c.anonymized_at is not null then
    return;
  end if;

  -- cancela reservas futuras (sinal estornado)
  update public.payments set status = 'refund_pending'
  where status = 'approved' and booking_id in (
    select id from public.bookings
    where client_id = p_client_id and status in ('pending_payment', 'confirmed') and starts_at > now()
  );
  update public.bookings
  set status = 'cancelled', cancelled_at = now(), cancelled_by = 'client', cancel_reason = 'LGPD'
  where client_id = p_client_id and status in ('pending_payment', 'confirmed') and starts_at > now();

  -- remove texto livre e invalida links antigos
  update public.bookings
  set notes = null, internal_notes = null, token_version = token_version + 1
  where client_id = p_client_id;

  update public.notifications
  set recipient = '[removido]', payload = '{}'::jsonb,
      status = case when status = 'pending' then 'cancelled'::public.notification_status else status end
  where booking_id in (select id from public.bookings where client_id = p_client_id);

  update public.payments set raw = null, pix_qr_code = null, pix_qr_code_base64 = null
  where booking_id in (select id from public.bookings where client_id = p_client_id);

  update public.clients
  set name = 'Cliente removido', email = null, phone = null, notes = null, user_id = null,
      anonymized_at = now()
  where id = p_client_id;

  insert into public.audit_log (business_id, actor_id, action, entity, entity_id, data)
  values (v_c.business_id, auth.uid(), 'client.anonymized', 'client', p_client_id,
    jsonb_build_object('requested_by', p_actor));
end
$$;

-- Pelo cliente, via link seguro
create or replace function public.lgpd_export_by_token(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_id uuid := public.booking_id_from_token(p_token);
begin
  if v_id is null then
    raise exception 'INVALID_TOKEN' using errcode = '28000';
  end if;
  return public.lgpd_export_client_data((select client_id from public.bookings where id = v_id));
end
$$;

create or replace function public.lgpd_delete_by_token(p_token text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id uuid := public.booking_id_from_token(p_token);
begin
  if v_id is null then
    raise exception 'INVALID_TOKEN' using errcode = '28000';
  end if;
  perform public.lgpd_anonymize((select client_id from public.bookings where id = v_id), 'client');
end
$$;

-- Pelo admin, no painel
create or replace function public.lgpd_export_client(p_client_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.clients c
    where c.id = p_client_id and public.has_role(c.business_id, '{admin}')
  ) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  return public.lgpd_export_client_data(p_client_id);
end
$$;

create or replace function public.lgpd_anonymize_client(p_client_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.clients c
    where c.id = p_client_id and public.has_role(c.business_id, '{admin}')
  ) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  perform public.lgpd_anonymize(p_client_id, 'business');
end
$$;

-- -----------------------------------------------------------------------------
-- Estatísticas de clientes (lista do painel)
-- -----------------------------------------------------------------------------
create or replace view public.client_stats
with (security_invoker = true)
as
select
  c.id as client_id,
  c.business_id,
  count(b.id) filter (where b.status in ('confirmed', 'completed', 'no_show')) as bookings_count,
  count(b.id) filter (where b.status = 'completed') as completed_count,
  count(b.id) filter (where b.status = 'no_show') as no_show_count,
  max(b.starts_at) filter (where b.status in ('completed', 'no_show')) as last_visit_at,
  min(b.starts_at) filter (where b.status = 'confirmed' and b.starts_at > now()) as next_booking_at,
  coalesce(sum(b.price_cents) filter (where b.status = 'completed'), 0) as revenue_cents
from public.clients c
left join public.bookings b on b.client_id = c.id
group by c.id, c.business_id;

-- -----------------------------------------------------------------------------
-- Permissões
-- -----------------------------------------------------------------------------
grant execute on function public.create_business(text, text, text, text, boolean, text) to authenticated;
grant execute on function public.invite_member(uuid, text, public.member_role, uuid) to authenticated;
grant execute on function public.panel_create_booking(uuid, uuid, uuid, uuid, timestamptz, uuid, text, text, text, text) to authenticated;
grant execute on function public.panel_cancel_booking(uuid, text, boolean) to authenticated;
grant execute on function public.report_summary(uuid, date, date, uuid, uuid) to authenticated;
grant execute on function public.lgpd_export_client(uuid) to authenticated;
grant execute on function public.lgpd_anonymize_client(uuid) to authenticated;
grant execute on function public.lgpd_export_by_token(text) to anon, authenticated;
grant execute on function public.lgpd_delete_by_token(text) to anon, authenticated;
grant select on public.client_stats to authenticated;
