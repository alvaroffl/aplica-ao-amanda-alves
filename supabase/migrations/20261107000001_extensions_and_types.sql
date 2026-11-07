-- =============================================================================
-- 0001 · Extensões, esquemas, tipos e utilitários
-- =============================================================================

create extension if not exists btree_gist with schema extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

-- Esquema interno: não é exposto pela API (PostgREST expõe apenas "public").
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Segurança por padrão: funções novas NÃO são executáveis por anon/authenticated.
-- Cada função pública recebe GRANT explícito.
-- (O EXECUTE para PUBLIC é um privilégio padrão GLOBAL; só pode ser revogado
-- globalmente — a revogação por esquema não remove privilégios globais.)
alter default privileges revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon, authenticated;
-- Tabelas novas não ficam acessíveis ao papel anônimo (o público usa apenas RPCs).
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;

-- -----------------------------------------------------------------------------
-- Tipos
-- -----------------------------------------------------------------------------
create type public.member_role as enum ('admin', 'professional', 'reception');

create type public.booking_status as enum (
  'pending_payment', -- pré-reserva aguardando sinal (expira)
  'confirmed',
  'completed',
  'no_show',
  'cancelled',
  'expired'
);

create type public.booking_source as enum ('public', 'panel');
create type public.cancel_actor as enum ('client', 'business', 'system');
create type public.deposit_type as enum ('none', 'fixed', 'percent');
create type public.time_off_kind as enum ('time_off', 'block');
create type public.notification_channel as enum ('email', 'whatsapp');
create type public.notification_status as enum (
  'pending', 'processing', 'sent', 'failed', 'cancelled', 'skipped'
);
create type public.payment_method as enum ('pix', 'card');
create type public.payment_status as enum (
  'pending', 'approved', 'rejected', 'cancelled', 'expired', 'refund_pending', 'refunded'
);

-- Intervalo de horários do dia (para regras semanais sem sobreposição).
create type public.timerange as range (subtype = time);

-- -----------------------------------------------------------------------------
-- Utilitários
-- -----------------------------------------------------------------------------

-- Somar minutos a um timestamptz não depende de fuso (diferente de somar dias),
-- então é seguro marcar como IMMUTABLE e usar em colunas geradas/índices.
create or replace function public.add_minutes(ts timestamptz, mins integer)
returns timestamptz
language sql
immutable
parallel safe
set search_path = ''
as $$
  select ts + make_interval(mins => mins)
$$;

create or replace function public.is_valid_timezone(tz text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
begin
  perform now() at time zone tz;
  return true;
exception when others then
  return false;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

-- Configurações internas (segredos gerados por ambiente; nunca no repositório).
create table private.settings (
  key text primary key,
  value text not null
);

insert into private.settings (key, value)
values ('manage_token_secret', encode(extensions.gen_random_bytes(32), 'hex'))
on conflict (key) do nothing;
