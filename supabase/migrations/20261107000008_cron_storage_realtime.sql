-- =============================================================================
-- 0008 · Tarefas agendadas (pg_cron), Storage (logotipos) e Realtime
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Worker: o pg_cron chama a Edge Function process-queue a cada minuto.
-- URL e segredo ficam no Supabase Vault (por ambiente, nunca no repositório):
--   select vault.create_secret('https://<ref>.supabase.co/functions/v1/process-queue', 'worker_url');
--   select vault.create_secret('<mesmo valor de WORKER_SECRET>', 'worker_secret');
-- -----------------------------------------------------------------------------
create or replace function private.invoke_worker()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'worker_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'worker_secret';
  if v_url is null or v_secret is null then
    return; -- ambiente ainda não configurado
  end if;
  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-worker-secret', v_secret),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
end
$$;

select cron.schedule('expire-pending-bookings', '* * * * *', $$ select public.expire_pending_bookings() $$);
select cron.schedule('process-queue', '* * * * *', $$ select private.invoke_worker() $$);
select cron.schedule(
  'cleanup',
  '17 3 * * *',
  $$
    delete from private.rate_limits where window_start < now() - interval '1 day';
    delete from net._http_response where created < now() - interval '1 day';
  $$
);

-- -----------------------------------------------------------------------------
-- Storage: logotipos (leitura pública; escrita só pelo admin do negócio)
-- Caminho: <business_id>/<arquivo>
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos', 'logos', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create or replace function public.storage_business_id(p_name text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  return (string_to_array(p_name, '/'))[1]::uuid;
exception when others then
  return null;
end
$$;

grant execute on function public.storage_business_id(text) to authenticated;

create policy "admin envia logotipo" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'logos'
    and public.has_role(public.storage_business_id(name), '{admin}')
  );
create policy "admin atualiza logotipo" on storage.objects
  for update to authenticated
  using (bucket_id = 'logos' and public.has_role(public.storage_business_id(name), '{admin}'));
create policy "admin remove logotipo" on storage.objects
  for delete to authenticated
  using (bucket_id = 'logos' and public.has_role(public.storage_business_id(name), '{admin}'));

-- -----------------------------------------------------------------------------
-- Realtime: a agenda do painel atualiza sozinha (RLS continua valendo)
-- -----------------------------------------------------------------------------
alter publication supabase_realtime add table public.bookings;
