-- =============================================================================
-- Seed de DESENVOLVIMENTO LOCAL (executado por `supabase db reset`).
-- Nunca rode em produção.
--
-- Login de demonstração do painel:  demo@agendae.dev  /  demo12345
-- Página pública:                   http://localhost:5173/studio-exemplo
-- =============================================================================

-- Worker local (pg_cron → Edge Function process-queue, via gateway "kong")
select vault.create_secret('http://kong:8000/functions/v1/process-queue', 'worker_url');
select vault.create_secret('local-worker-secret', 'worker_secret');

-- -----------------------------------------------------------------------------
-- Usuário de demonstração
-- -----------------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token
) values (
  '00000000-0000-0000-0000-000000000000', 'd0000000-0000-0000-0000-000000000001',
  'authenticated', 'authenticated', 'demo@agendae.dev',
  extensions.crypt('demo12345', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Carla Souza"}', now(), now(),
  '', '', '', '', '', '', '', ''
);

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) values (
  gen_random_uuid(), 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
  '{"sub":"d0000000-0000-0000-0000-000000000001","email":"demo@agendae.dev","email_verified":true}',
  'email', now(), now(), now()
);

-- -----------------------------------------------------------------------------
-- Negócio de exemplo
-- -----------------------------------------------------------------------------
insert into public.businesses (id, slug, name, description, phone, email, timezone)
values (
  'e0000000-0000-0000-0000-000000000001', 'studio-exemplo', 'Studio Exemplo',
  'Salão de beleza no centro. Cortes, coloração, escova e manicure com hora marcada.',
  '+5511988887777', 'contato@studio-exemplo.dev', 'America/Sao_Paulo'
);

insert into public.units (id, business_id, name, slug, address, timezone)
values (
  'e1000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001',
  'Centro', 'centro', 'Rua das Flores, 123 — Centro, São Paulo/SP', 'America/Sao_Paulo'
);

insert into public.business_members (business_id, user_id, role)
values ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'admin');

insert into public.professionals (id, business_id, user_id, name, bio, color, sort_order) values
  ('e2000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
   'Carla Souza', 'Especialista em cortes e coloração.', '#7c3aed', 1),
  ('e2000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', null,
   'Rafael Lima', 'Cortes masculinos e barba.', '#0891b2', 2),
  ('e2000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', null,
   'Juliana Alves', 'Manicure, pedicure e escova.', '#db2777', 3);

insert into public.professional_units (business_id, professional_id, unit_id)
select 'e0000000-0000-0000-0000-000000000001', id, 'e1000000-0000-0000-0000-000000000001'
from public.professionals where business_id = 'e0000000-0000-0000-0000-000000000001';

insert into public.services (
  id, business_id, name, description, category, duration_min, price_cents,
  buffer_after_min, min_notice_min, max_advance_days, deposit_type, deposit_value, sort_order
) values
  ('e3000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001',
   'Corte feminino', 'Lavagem, corte e finalização.', 'Cabelo', 60, 9000, 10, 120, 60, 'percent', 30, 1),
  ('e3000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001',
   'Corte masculino', 'Corte na tesoura ou máquina.', 'Cabelo', 30, 4500, 0, 60, 60, 'none', 0, 2),
  ('e3000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001',
   'Escova', 'Escova modelada.', 'Cabelo', 45, 6000, 0, 60, 60, 'none', 0, 3),
  ('e3000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000001',
   'Coloração', 'Coloração completa com tonalizante.', 'Cabelo', 120, 22000, 15, 240, 90, 'fixed', 5000, 4),
  ('e3000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000001',
   'Manicure', 'Cutilagem e esmaltação.', 'Unhas', 45, 4000, 5, 60, 60, 'none', 0, 5),
  ('e3000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000001',
   'Barba', 'Barba com toalha quente.', 'Barbearia', 30, 3500, 0, 60, 60, 'none', 0, 6);

insert into public.service_professionals (business_id, service_id, professional_id) values
  ('e0000000-0000-0000-0000-000000000001', 'e3000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0000-000000000001'),
  ('e0000000-0000-0000-0000-000000000001', 'e3000000-0000-0000-0000-000000000003', 'e2000000-0000-0000-0000-000000000001'),
  ('e0000000-0000-0000-0000-000000000001', 'e3000000-0000-0000-0000-000000000004', 'e2000000-0000-0000-0000-000000000001'),
  ('e0000000-0000-0000-0000-000000000001', 'e3000000-0000-0000-0000-000000000002', 'e2000000-0000-0000-0000-000000000002'),
  ('e0000000-0000-0000-0000-000000000001', 'e3000000-0000-0000-0000-000000000006', 'e2000000-0000-0000-0000-000000000002'),
  ('e0000000-0000-0000-0000-000000000001', 'e3000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0000-000000000002'),
  ('e0000000-0000-0000-0000-000000000001', 'e3000000-0000-0000-0000-000000000005', 'e2000000-0000-0000-0000-000000000003'),
  ('e0000000-0000-0000-0000-000000000001', 'e3000000-0000-0000-0000-000000000003', 'e2000000-0000-0000-0000-000000000003');

-- Segunda a sábado: 09–12 e 13–19 (domingo fechado)
insert into public.availability_rules (business_id, professional_id, unit_id, weekday, start_time, end_time)
select pu.business_id, pu.professional_id, pu.unit_id, wd, t.s, t.e
from public.professional_units pu
cross join generate_series(1, 6) wd
cross join (values (time '09:00', time '12:00'), (time '13:00', time '19:00')) t(s, e)
where pu.business_id = 'e0000000-0000-0000-0000-000000000001';

-- -----------------------------------------------------------------------------
-- Clientes e reservas de exemplo (relativos à data atual)
-- -----------------------------------------------------------------------------
insert into public.clients (id, business_id, name, email, phone, notes, consent_at, consent_version) values
  ('e4000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Mariana Costa', 'mariana@exemplo.dev', '+5511912345678', 'Prefere horários pela manhã.', now(), 'v1'),
  ('e4000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'Pedro Henrique', 'pedro@exemplo.dev', '+5511923456789', null, now(), 'v1'),
  ('e4000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 'Beatriz Rocha', 'beatriz@exemplo.dev', '+5511934567890', 'Alergia a amônia.', now(), 'v1'),
  ('e4000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000001', 'Lucas Martins', 'lucas@exemplo.dev', '+5511945678901', null, now(), 'v1');

-- Gera reservas nos dias úteis ao redor de hoje (passado: concluídas/faltas; futuro: confirmadas)
do $$
declare
  d date;
  i integer := 0;
  v_status public.booking_status;
  v_start timestamptz;
  r record;
begin
  for d in select generate_series(current_date - 21, current_date + 10, interval '1 day')::date loop
    continue when extract(dow from d) = 0;
    for r in
      select * from (values
        ('e2000000-0000-0000-0000-000000000001'::uuid, 'e3000000-0000-0000-0000-000000000001'::uuid, time '09:00', 60, 10, 9000),
        ('e2000000-0000-0000-0000-000000000001'::uuid, 'e3000000-0000-0000-0000-000000000003'::uuid, time '14:00', 45, 0, 6000),
        ('e2000000-0000-0000-0000-000000000002'::uuid, 'e3000000-0000-0000-0000-000000000002'::uuid, time '10:00', 30, 0, 4500),
        ('e2000000-0000-0000-0000-000000000002'::uuid, 'e3000000-0000-0000-0000-000000000006'::uuid, time '16:00', 30, 0, 3500),
        ('e2000000-0000-0000-0000-000000000003'::uuid, 'e3000000-0000-0000-0000-000000000005'::uuid, time '11:00', 45, 5, 4000)
      ) as t(pro, svc, at, dur, buf, price)
    loop
      i := i + 1;
      continue when (i % 3) = 0; -- deixa buracos na agenda
      v_start := (d + r.at) at time zone 'America/Sao_Paulo';
      v_status := case
        when v_start > now() then 'confirmed'
        when (i % 11) = 0 then 'no_show'
        when (i % 13) = 0 then 'cancelled'
        else 'completed' end;
      insert into public.bookings (
        business_id, unit_id, professional_id, service_id, client_id,
        starts_at, ends_at, buffer_after_min, status, source, price_cents,
        cancelled_at, cancelled_by
      ) values (
        'e0000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', r.pro, r.svc,
        ('e4000000-0000-0000-0000-00000000000' || (1 + i % 4))::uuid,
        v_start, v_start + make_interval(mins => r.dur), r.buf, v_status,
        case when i % 2 = 0 then 'public'::public.booking_source else 'panel'::public.booking_source end,
        r.price,
        case when v_status = 'cancelled' then v_start - interval '1 day' end,
        case when v_status = 'cancelled' then 'client'::public.cancel_actor end
      );
    end loop;
  end loop;
end
$$;

-- O seed não deve disparar envios reais: marca as notificações geradas como ignoradas.
update public.notifications set status = 'skipped', last_error = 'seed';

-- Feriado de exemplo
insert into public.holidays (business_id, date, name)
values ('e0000000-0000-0000-0000-000000000001', make_date(extract(year from current_date)::int, 12, 25), 'Natal')
on conflict do nothing;
