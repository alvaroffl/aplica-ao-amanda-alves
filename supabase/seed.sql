-- =============================================================================
-- Seed de DESENVOLVIMENTO / APRESENTAÇÃO (executado por `supabase db reset`).
-- Clínica Amanda Alves | Estética Avançada (app exclusivo).
--
-- Fonte das informações: docs/referencia-amanda-alves/ (00-LEIA-ME.md).
--   • Nome, contatos, horários e procedimentos: site oficial
--     https://www.amandaalvespmu.com.br
--   • Preços, durações, sinais, política, clientes e reservas: FICTÍCIOS,
--     marcados com is_demo = true. Remova com `pnpm demo:purge` (ou pelo painel,
--     em Configurações) antes do lançamento real.
--
-- Login do painel (apresentação):  amanda@demo.test  /  demo12345
-- Página pública:                  http://localhost:5173/amanda-alves
-- =============================================================================

-- Worker local (pg_cron → Edge Function process-queue, via gateway "kong")
select vault.create_secret('http://kong:8000/functions/v1/process-queue', 'worker_url');
select vault.create_secret('local-worker-secret', 'worker_secret');

-- -----------------------------------------------------------------------------
-- Usuário do painel (papel admin)
-- -----------------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token
) values (
  '00000000-0000-0000-0000-000000000000', 'd0000000-0000-0000-0000-000000000001',
  'authenticated', 'authenticated', 'amanda@demo.test',
  extensions.crypt('demo12345', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"Amanda Alves"}', now(), now(),
  '', '', '', '', '', '', '', ''
);

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) values (
  gen_random_uuid(), 'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
  '{"sub":"d0000000-0000-0000-0000-000000000001","email":"amanda@demo.test","email_verified":true}',
  'email', now(), now(), now()
);

-- -----------------------------------------------------------------------------
-- A clínica (dados do site oficial)
-- -----------------------------------------------------------------------------
insert into public.businesses (
  id, slug, name, description, phone, email, timezone, slot_interval_min, booking_hold_min,
  max_installments, payment_methods
) values (
  'e0000000-0000-0000-0000-000000000001', 'amanda-alves',
  'Amanda Alves | Estética Avançada',
  'Beleza elevada à sua forma mais autêntica. Micropigmentação de sobrancelhas e lábios, camuflagem de cicatrizes e estrias, remoção a laser e protocolos de pele, com mais de 10 anos de experiência e mais de 20 mil procedimentos realizados.',
  '+5532988829364', 'contato@amandaalvespmu.com.br', 'America/Sao_Paulo', 30, 15,
  3, '{pix,card}' -- parcelamento em até 3x: valor de demonstração
);

-- O endereço não foi confirmado: fica vazio até a Amanda informar.
insert into public.units (id, business_id, name, slug, address, phone, timezone)
values (
  'e1000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001',
  'Clínica Amanda Alves', 'clinica', null, '+5532988829364', 'America/Sao_Paulo'
);

insert into public.business_members (business_id, user_id, role)
values ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'admin');

-- credentials (formação) fica vazio até confirmação — não aparece na página pública.
insert into public.professionals (id, business_id, user_id, name, bio, color, sort_order, credentials)
values (
  'e2000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001', 'Amanda Alves',
  'Especialista em micropigmentação e estética avançada. Mais de 10 anos de experiência e mais de 20 mil procedimentos realizados.',
  '#6b705c', 1, null
);

insert into public.professional_units (business_id, professional_id, unit_id) values
  ('e0000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001');

-- -----------------------------------------------------------------------------
-- Serviços — DESCRIÇÕES a partir do site; PREÇO, DURAÇÃO e SINAL FICTÍCIOS
-- -----------------------------------------------------------------------------
insert into public.services (
  id, business_id, name, description, category, duration_min, price_cents,
  buffer_after_min, min_notice_min, max_advance_days, deposit_type, deposit_value, sort_order, is_demo
) values
  ('e3000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001',
   'Avaliação gratuita', 'Conversa e análise personalizada para indicar o procedimento ideal para você. Vale para qualquer serviço e não tem custo.',
   'Avaliação', 30, 0, 0, 120, 60, 'none', 0, 1, true),
  ('e3000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001',
   'Micro Sobrancelha (Nanoblading e Shadow)', 'Valoriza o olhar com sobrancelhas naturais todos os dias. Fio a fio e/ou shadow com mapeamento facial personalizado; duração média de 8 a 12 meses, com saída gradual da cor.',
   'Sobrancelhas', 150, 79000, 15, 1440, 90, 'percent', 30, 2, true),
  ('e3000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001',
   'Retoque da Micro Sobrancelha', 'Retoque para clientes que fizeram a Micro Sobrancelha nos últimos 45 dias.',
   'Sobrancelhas', 90, 19000, 15, 1440, 60, 'percent', 30, 3, true),
  ('e3000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000001',
   'Micro Labial · Revitalização', 'Efeito Lip Tint, aveludado e translúcido, que devolve a cor a lábios pálidos.',
   'Lábios', 150, 89000, 15, 1440, 90, 'percent', 30, 4, true),
  ('e3000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000001',
   'Micro Labial · Neutralização', 'Efeito Lip Tint que clareia lábios escuros ou arroxeados.',
   'Lábios', 150, 99000, 15, 1440, 90, 'percent', 30, 5, true),
  ('e3000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000001',
   'Micro Labial · Hydra Gloss', 'Hidratação dos lábios com ácido hialurônico e vitaminas.',
   'Lábios', 60, 25000, 15, 1440, 90, 'percent', 50, 6, true),
  ('e3000000-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000001',
   'Camuflagem de Cicatrizes e Estrias (por sessão)', 'Arte e técnica para suavizar o contraste de estrias e cicatrizes, com pigmentos de alta fixação, materiais esterilizados e normas de biossegurança.',
   'Camuflagem', 90, 45000, 15, 1440, 90, 'percent', 30, 7, true),
  ('e3000000-0000-0000-0000-000000000008', 'e0000000-0000-0000-0000-000000000001',
   'Remoção a Laser (por sessão)', 'Remoção de micropigmentação antiga em poucas sessões, devolvendo harmonia às sobrancelhas.',
   'Remoção', 45, 28000, 15, 1440, 90, 'percent', 50, 8, true),
  ('e3000000-0000-0000-0000-000000000009', 'e0000000-0000-0000-0000-000000000001',
   'Protocolo Rejuvenescimento', 'Gerenciamento de pele com protocolo definido após avaliação personalizada.',
   'Protocolos de pele', 90, 35000, 15, 1440, 90, 'percent', 50, 9, true),
  ('e3000000-0000-0000-0000-000000000010', 'e0000000-0000-0000-0000-000000000001',
   'Protocolo Controle de Acne', 'Gerenciamento de pele com protocolo definido após avaliação personalizada.',
   'Protocolos de pele', 75, 28000, 15, 1440, 90, 'percent', 50, 10, true),
  ('e3000000-0000-0000-0000-000000000011', 'e0000000-0000-0000-0000-000000000001',
   'Protocolo Hidratação Profunda', 'Gerenciamento de pele com protocolo definido após avaliação personalizada.',
   'Protocolos de pele', 60, 22000, 15, 1440, 90, 'percent', 50, 11, true);

insert into public.service_professionals (business_id, service_id, professional_id)
select business_id, id, 'e2000000-0000-0000-0000-000000000001'
from public.services where business_id = 'e0000000-0000-0000-0000-000000000001';

-- -----------------------------------------------------------------------------
-- Horários (site oficial): terça a sexta 9h–20h, sábado 9h–15h.
-- Segunda e domingo fechados. Marcados como demo para serem revisados.
-- -----------------------------------------------------------------------------
insert into public.availability_rules (business_id, professional_id, unit_id, weekday, start_time, end_time, is_demo)
select 'e0000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0000-000000000001',
       'e1000000-0000-0000-0000-000000000001', wd, time '09:00',
       case when wd = 6 then time '15:00' else time '20:00' end, true
from generate_series(2, 6) wd;

-- -----------------------------------------------------------------------------
-- Política de remarcação/cancelamento FICTÍCIA (editável em Configurações)
-- -----------------------------------------------------------------------------
update public.booking_policies
set reschedule_min_hours = 48,
    refund_min_hours = 24,
    refund_percent = 100,
    client_can_reschedule = true,
    client_can_cancel = true,
    notes = 'Remarcação gratuita com até 48h de antecedência. Cancelamentos com menos de 24h não têm o sinal devolvido.',
    is_demo = true
where business_id = 'e0000000-0000-0000-0000-000000000001';

-- Bloqueio manual de exemplo (próxima quarta-feira, 14h–16h)
insert into public.time_off (business_id, professional_id, kind, starts_at, ends_at, reason, is_demo)
select 'e0000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0000-000000000001', 'block',
       (d + time '14:00') at time zone 'America/Sao_Paulo',
       (d + time '16:00') at time zone 'America/Sao_Paulo',
       'Bloqueio de exemplo (demonstração)', true
from (select current_date + ((3 - extract(dow from current_date)::int + 7) % 7 + 7) as d) x;

-- -----------------------------------------------------------------------------
-- Clientes e reservas FICTÍCIAS (relativas à data atual)
-- -----------------------------------------------------------------------------
insert into public.clients (id, business_id, name, email, phone, notes, consent_at, consent_version, is_demo) values
  ('e4000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Juliana Ferreira (demo)', 'juliana@exemplo.dev', '+5532991110001', 'Cliente fictícia de demonstração.', now(), 'demo', true),
  ('e4000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'Camila Duarte (demo)', 'camila@exemplo.dev', '+5532991110002', 'Cliente fictícia de demonstração.', now(), 'demo', true),
  ('e4000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 'Patrícia Moura (demo)', 'patricia@exemplo.dev', '+5532991110003', 'Cliente fictícia de demonstração.', now(), 'demo', true),
  ('e4000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000001', 'Fernanda Lopes (demo)', 'fernanda@exemplo.dev', '+5532991110004', 'Cliente fictícia de demonstração.', now(), 'demo', true);

-- Reservas de terça a sábado ao redor de hoje. As que têm sinal recebem um
-- pagamento de teste aprovado (provedor "fake", test_mode = true).
do $$
declare
  d date;
  i integer := 0;
  v_status public.booking_status;
  v_start timestamptz;
  v_booking uuid;
  r record;
begin
  for d in select generate_series(current_date - 21, current_date + 10, interval '1 day')::date loop
    continue when extract(dow from d) in (0, 1);
    for r in
      select s.id as svc, s.duration_min as dur, s.buffer_after_min as buf, s.price_cents as price,
             public.compute_deposit(s.price_cents, s.deposit_type, s.deposit_value) as deposit, t.at
      from (values
        ('e3000000-0000-0000-0000-000000000002'::uuid, time '09:00'),
        ('e3000000-0000-0000-0000-000000000006'::uuid, time '13:00'),
        ('e3000000-0000-0000-0000-000000000001'::uuid, time '16:00'),
        ('e3000000-0000-0000-0000-000000000009'::uuid, time '17:00')
      ) as t(svc, at)
      join public.services s on s.id = t.svc
    loop
      i := i + 1;
      continue when (i % 3) = 0; -- deixa horários livres
      continue when extract(dow from d) = 6 and r.at >= time '14:00'; -- sábado até 15h
      v_start := (d + r.at) at time zone 'America/Sao_Paulo';
      v_status := case
        when v_start > now() then 'confirmed'
        when (i % 11) = 0 then 'no_show'
        when (i % 13) = 0 then 'cancelled'
        else 'completed' end;
      insert into public.bookings (
        business_id, unit_id, professional_id, service_id, client_id,
        starts_at, ends_at, buffer_after_min, status, source, price_cents, deposit_cents,
        cancelled_at, cancelled_by, is_demo
      ) values (
        'e0000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001',
        'e2000000-0000-0000-0000-000000000001', r.svc,
        ('e4000000-0000-0000-0000-00000000000' || (1 + i % 4))::uuid,
        v_start, v_start + make_interval(mins => r.dur), r.buf, v_status,
        case when i % 2 = 0 then 'public'::public.booking_source else 'panel'::public.booking_source end,
        r.price, r.deposit,
        case when v_status = 'cancelled' then v_start - interval '3 days' end,
        case when v_status = 'cancelled' then 'client'::public.cancel_actor end,
        true
      ) returning id into v_booking;

      if r.deposit > 0 then
        insert into public.payments (
          business_id, booking_id, provider, provider_payment_id, method, method_detail,
          installments, amount_cents, status, refunded_cents, test_mode, created_at
        ) values (
          'e0000000-0000-0000-0000-000000000001', v_booking, 'fake', 'demo-' || v_booking,
          case when i % 2 = 0 then 'pix'::public.payment_method else 'card'::public.payment_method end,
          case when i % 2 = 0 then 'bank_transfer' else 'credit_card' end,
          case when i % 2 = 0 then null else 1 + (i % 3) end,
          r.deposit,
          case when v_status = 'cancelled' then 'refunded'::public.payment_status
               else 'approved'::public.payment_status end,
          case when v_status = 'cancelled' then r.deposit else 0 end,
          true, v_start - interval '5 days'
        );
      end if;
    end loop;
  end loop;
end
$$;

-- O seed não deve disparar envios reais: marca as notificações geradas como ignoradas.
update public.notifications set status = 'skipped', last_error = 'seed';

-- Feriado nacional (real; não é dado de demonstração)
insert into public.holidays (business_id, date, name)
values ('e0000000-0000-0000-0000-000000000001', make_date(extract(year from current_date)::int, 12, 25), 'Natal')
on conflict do nothing;
