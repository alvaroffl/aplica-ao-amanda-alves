-- =============================================================================
-- 0006 · Gatilhos de notificação (outbox), fila do worker, pagamentos, auditoria
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enfileiramento
-- -----------------------------------------------------------------------------
create or replace function public.enqueue_booking_notifications(p_booking_id uuid, p_template text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_b public.bookings%rowtype;
  v_biz public.businesses%rowtype;
  v_client public.clients%rowtype;
  v_channel public.notification_channel;
  v_recipient text;
  v_epoch text;
begin
  select * into v_b from public.bookings where id = p_booking_id;
  select * into v_biz from public.businesses where id = v_b.business_id;
  select * into v_client from public.clients where id = v_b.client_id;
  if v_client.anonymized_at is not null then
    return;
  end if;
  v_epoch := extract(epoch from v_b.starts_at)::bigint::text;

  foreach v_channel in array array['email', 'whatsapp']::public.notification_channel[] loop
    v_recipient := case v_channel
      when 'email' then v_client.email
      when 'whatsapp' then case when v_biz.whatsapp_enabled then v_client.phone end
    end;
    continue when v_recipient is null;

    -- mensagem imediata (confirmação / reagendamento / cancelamento)
    insert into public.notifications (
      business_id, booking_id, channel, template, recipient, payload, scheduled_for, dedupe_key
    ) values (
      v_b.business_id, v_b.id, v_channel, p_template, v_recipient,
      jsonb_build_object('starts_at', v_b.starts_at), now(),
      v_b.id || ':' || v_channel || ':' || p_template || ':' || v_epoch
    )
    on conflict (dedupe_key) do nothing;

    -- lembretes
    if p_template in ('booking_confirmed', 'booking_rescheduled') then
      if v_biz.reminder_24h and v_b.starts_at - interval '24 hours' > now() then
        insert into public.notifications (
          business_id, booking_id, channel, template, recipient, payload, scheduled_for, dedupe_key
        ) values (
          v_b.business_id, v_b.id, v_channel, 'reminder_24h', v_recipient,
          jsonb_build_object('starts_at', v_b.starts_at), v_b.starts_at - interval '24 hours',
          v_b.id || ':' || v_channel || ':reminder_24h:' || v_epoch
        )
        on conflict (dedupe_key) do nothing;
      end if;
      if v_biz.reminder_2h and v_b.starts_at - interval '2 hours' > now() then
        insert into public.notifications (
          business_id, booking_id, channel, template, recipient, payload, scheduled_for, dedupe_key
        ) values (
          v_b.business_id, v_b.id, v_channel, 'reminder_2h', v_recipient,
          jsonb_build_object('starts_at', v_b.starts_at), v_b.starts_at - interval '2 hours',
          v_b.id || ':' || v_channel || ':reminder_2h:' || v_epoch
        )
        on conflict (dedupe_key) do nothing;
      end if;
    end if;
  end loop;
end
$$;

create or replace function public.cancel_pending_reminders(p_booking_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.notifications
  set status = 'cancelled'
  where booking_id = p_booking_id
    and status = 'pending'
    and template in ('reminder_24h', 'reminder_2h')
$$;

-- Gatilho único que reage às mudanças relevantes da reserva.
create or replace function public.bookings_after_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'confirmed' and new.starts_at > now() then
      perform public.enqueue_booking_notifications(new.id, 'booking_confirmed');
    end if;
    insert into public.audit_log (business_id, actor_id, action, entity, entity_id, data)
    values (new.business_id, auth.uid(), 'booking.created', 'booking', new.id,
      jsonb_build_object('status', new.status, 'starts_at', new.starts_at, 'source', new.source));
    return null;
  end if;

  if old.status = 'pending_payment' and new.status = 'confirmed' then
    perform public.enqueue_booking_notifications(new.id, 'booking_confirmed');
  elsif new.status = 'cancelled' and old.status <> 'cancelled' then
    perform public.cancel_pending_reminders(new.id);
    if old.status = 'confirmed' and new.starts_at > now() then
      perform public.enqueue_booking_notifications(new.id, 'booking_cancelled');
    end if;
  elsif new.status = 'confirmed'
    and (new.starts_at <> old.starts_at or new.professional_id <> old.professional_id) then
    perform public.cancel_pending_reminders(new.id);
    if new.starts_at > now() then
      perform public.enqueue_booking_notifications(new.id, 'booking_rescheduled');
    end if;
  elsif new.status in ('completed', 'no_show', 'expired') and old.status <> new.status then
    perform public.cancel_pending_reminders(new.id);
  end if;

  if new.status <> old.status or new.starts_at <> old.starts_at
     or new.professional_id <> old.professional_id then
    insert into public.audit_log (business_id, actor_id, action, entity, entity_id, data)
    values (new.business_id, auth.uid(), 'booking.updated', 'booking', new.id,
      jsonb_build_object(
        'status', jsonb_build_array(old.status, new.status),
        'starts_at', jsonb_build_array(old.starts_at, new.starts_at),
        'professional_id', jsonb_build_array(old.professional_id, new.professional_id)
      ));
  end if;
  return null;
end
$$;

create trigger bookings_after_change
  after insert or update on public.bookings
  for each row execute function public.bookings_after_change();

-- -----------------------------------------------------------------------------
-- Fila do worker (Edge Function process-queue)
-- -----------------------------------------------------------------------------
create or replace function public.claim_notifications(p_limit integer default 25)
returns setof public.notifications
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- recupera itens presos (worker caiu no meio do envio)
  update public.notifications
  set status = 'pending', locked_at = null
  where status = 'processing' and locked_at < now() - interval '5 minutes';

  return query
  update public.notifications n
  set status = 'processing', locked_at = now(), attempts = n.attempts + 1
  where n.id in (
    select id from public.notifications
    where status = 'pending' and scheduled_for <= now()
    order by scheduled_for
    limit p_limit
    for update skip locked
  )
  returning n.*;
end
$$;

-- Contexto completo para renderizar a mensagem no momento do envio
-- (dados sempre atuais: se a reserva mudou, o lembrete antigo é descartado).
create or replace function public.notification_context(p_notification_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'notification', to_jsonb(n),
    'booking', case when n.booking_id is not null then public.booking_public_payload(n.booking_id) end,
    'business', jsonb_build_object(
      'id', biz.id, 'name', biz.name, 'slug', biz.slug, 'phone', biz.phone,
      'email', biz.email, 'locale', biz.locale, 'timezone', biz.timezone
    )
  )
  from public.notifications n
  join public.businesses biz on biz.id = n.business_id
  where n.id = p_notification_id
$$;

create or replace function public.complete_notification(
  p_id uuid,
  p_status public.notification_status,
  p_error text default null,
  p_provider_message_id text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_n public.notifications%rowtype;
begin
  select * into v_n from public.notifications where id = p_id for update;
  if not found then
    return;
  end if;

  if p_status = 'failed' and v_n.attempts < v_n.max_attempts then
    -- backoff exponencial: 1, 2, 4, 8… minutos
    update public.notifications
    set status = 'pending', locked_at = null, last_error = left(p_error, 1000),
        scheduled_for = now() + make_interval(mins => power(2, v_n.attempts - 1)::int)
    where id = p_id;
  else
    update public.notifications
    set status = p_status, locked_at = null, last_error = left(p_error, 1000),
        provider_message_id = coalesce(p_provider_message_id, provider_message_id),
        sent_at = case when p_status = 'sent' then now() else sent_at end
    where id = p_id;
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- Pagamentos
-- -----------------------------------------------------------------------------

-- Confirmação vinda do webhook do provedor (idempotente).
-- Retorna: 'confirmed' | 'already_processed' | 'refund_required'
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

create or replace function public.fail_payment(
  p_payment_id uuid, p_status public.payment_status, p_raw jsonb default null
)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.payments
  set status = p_status, raw = coalesce(p_raw, raw)
  where id = p_payment_id and status = 'pending'
$$;

create or replace function public.claim_refunds(p_limit integer default 10)
returns setof public.payments
language sql
security definer
set search_path = ''
as $$
  update public.payments p
  set attempts = p.attempts + 1
  where p.id in (
    select id from public.payments
    where status = 'refund_pending' and attempts < 8
      and updated_at <= now() - make_interval(mins => least(power(2, attempts)::int - 1, 60))
    order by updated_at
    limit p_limit
    for update skip locked
  )
  returning p.*
$$;

create or replace function public.complete_refund(p_payment_id uuid, p_ok boolean, p_error text default null)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.payments
  set status = case when p_ok then 'refunded'::public.payment_status else status end,
      refunded_cents = case when p_ok then amount_cents else refunded_cents end,
      last_error = case when p_ok then null else left(p_error, 1000) end
  where id = p_payment_id
$$;

-- -----------------------------------------------------------------------------
-- Rate limit (janela fixa). true = permitido.
-- -----------------------------------------------------------------------------
create or replace function public.check_rate_limit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_window timestamptz := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );
  v_hits integer;
begin
  insert into private.rate_limits as r (key, window_start, hits)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update set hits = r.hits + 1
  returning hits into v_hits;

  -- limpeza oportunista de janelas antigas
  if random() < 0.01 then
    delete from private.rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_hits <= p_max;
end
$$;

-- -----------------------------------------------------------------------------
-- Permissões (somente backend)
-- -----------------------------------------------------------------------------
grant execute on function public.claim_notifications(integer) to service_role;
grant execute on function public.notification_context(uuid) to service_role;
grant execute on function public.complete_notification(uuid, public.notification_status, text, text) to service_role;
grant execute on function public.confirm_payment(uuid, text, jsonb) to service_role;
grant execute on function public.fail_payment(uuid, public.payment_status, jsonb) to service_role;
grant execute on function public.claim_refunds(integer) to service_role;
grant execute on function public.complete_refund(uuid, boolean, text) to service_role;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;
