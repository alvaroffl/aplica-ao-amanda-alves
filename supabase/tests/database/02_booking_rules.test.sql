begin;
\ir ../helpers/fixtures.psql
select plan(22);

-- ---------------------------------------------------------------------------
-- Fuso horário: 09:00 em São Paulo = 12:00 UTC (sem horário de verão)
-- ---------------------------------------------------------------------------
select is(
  (select min(starts_at) from public.get_available_slots(
    '40000000-0000-0000-0000-0000000000a1', '20000000-0000-0000-0000-00000000000a',
    pg_temp.test_day(), pg_temp.test_day(), '30000000-0000-0000-0000-0000000000a1')),
  pg_temp.at_local('09:00'),
  'primeiro horário = 09:00 no fuso da unidade'
);
select is(
  (select (min(starts_at) at time zone 'UTC')::time from public.get_available_slots(
    '40000000-0000-0000-0000-0000000000a1', '20000000-0000-0000-0000-00000000000a',
    pg_temp.test_day(), pg_temp.test_day(), '30000000-0000-0000-0000-0000000000a1')),
  '12:00'::time,
  'guardado em UTC (12:00Z)'
);
select is(
  (select (min(starts_at) at time zone 'Europe/Lisbon')::time from public.get_available_slots(
    '40000000-0000-0000-0000-0000000000a1', '20000000-0000-0000-0000-0000000000a2',
    pg_temp.test_day(), pg_temp.test_day())),
  '09:00'::time,
  'unidade em outro fuso (Lisboa) também começa às 09:00 locais'
);
select ok(
  not exists (select 1 from public.get_available_slots(
    '40000000-0000-0000-0000-0000000000a1', '20000000-0000-0000-0000-00000000000a',
    pg_temp.test_day(), pg_temp.test_day(), '30000000-0000-0000-0000-0000000000a1') s
    where s.starts_at = pg_temp.at_local('11:30')),
  'serviço de 60 min não é oferecido às 11:30 (invadiria a pausa do almoço)'
);

-- ---------------------------------------------------------------------------
-- Criação, conflito e idempotência
-- ---------------------------------------------------------------------------
select is(
  (pg_temp.book('40000000-0000-0000-0000-0000000000a1', '30000000-0000-0000-0000-0000000000a1',
    pg_temp.at_local('10:00'), 'c1@teste.dev', '50000000-0000-0000-0000-000000000001') ->> 'status'),
  'confirmed',
  'reserva sem sinal nasce confirmada'
);
select throws_ok(
  $$ select pg_temp.book('40000000-0000-0000-0000-0000000000a1', '30000000-0000-0000-0000-0000000000a1',
    pg_temp.at_local('10:00'), 'c2@teste.dev') $$,
  'P0001', 'SLOT_UNAVAILABLE',
  'mesmo profissional no mesmo horário é recusado'
);
select is(
  (pg_temp.book('40000000-0000-0000-0000-0000000000a1', '30000000-0000-0000-0000-0000000000a1',
    pg_temp.at_local('10:00'), 'c1@teste.dev', '50000000-0000-0000-0000-000000000001') ->> 'replayed'),
  'true',
  'repetir a mesma chave de idempotência devolve a mesma reserva'
);
select is(
  (select count(*) from public.bookings where idempotency_key = '50000000-0000-0000-0000-000000000001'),
  1::bigint,
  'idempotência: apenas uma linha criada'
);
select is(
  (pg_temp.book('40000000-0000-0000-0000-0000000000a1', null, pg_temp.at_local('10:00'), 'c3@teste.dev') -> 'professional' ->> 'id'),
  '30000000-0000-0000-0000-0000000000a2',
  '"qualquer profissional" escolhe quem está livre'
);
select throws_ok(
  $$ select pg_temp.book('40000000-0000-0000-0000-0000000000a1', null, pg_temp.at_local('10:00'), 'c4@teste.dev') $$,
  'P0001', 'SLOT_UNAVAILABLE',
  'sem profissional livre → indisponível'
);

-- A garantia está no banco: mesmo um INSERT direto é barrado.
select throws_ok(
  $$ insert into public.bookings (business_id, unit_id, professional_id, service_id, client_id, starts_at, ends_at)
     select '10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a',
            '30000000-0000-0000-0000-0000000000a1', '40000000-0000-0000-0000-0000000000a1', id,
            pg_temp.at_local('10:30'), pg_temp.at_local('11:00')
     from public.clients limit 1 $$,
  '23P01', null,
  'exclusion constraint barra sobreposição até em INSERT direto'
);

-- ---------------------------------------------------------------------------
-- Buffer: Corte 13:00–14:00 + 10 min de buffer ocupa até 14:10
-- ---------------------------------------------------------------------------
select lives_ok(
  $$ select pg_temp.book('40000000-0000-0000-0000-0000000000a1', '30000000-0000-0000-0000-0000000000a1',
    pg_temp.at_local('13:00'), 'c5@teste.dev') $$,
  'reserva às 13:00'
);
select throws_ok(
  $$ insert into public.bookings (business_id, unit_id, professional_id, service_id, client_id, starts_at, ends_at)
     select '10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a',
            '30000000-0000-0000-0000-0000000000a1', '40000000-0000-0000-0000-0000000000a1', id,
            pg_temp.at_local('14:05'), pg_temp.at_local('14:35')
     from public.clients limit 1 $$,
  '23P01', null,
  'buffer depois do atendimento também é protegido'
);

-- ---------------------------------------------------------------------------
-- Cancelamento libera o horário
-- ---------------------------------------------------------------------------
update public.bookings set status = 'cancelled'
where idempotency_key = '50000000-0000-0000-0000-000000000001';
select ok(
  exists (select 1 from public.get_available_slots(
    '40000000-0000-0000-0000-0000000000a1', '20000000-0000-0000-0000-00000000000a',
    pg_temp.test_day(), pg_temp.test_day(), '30000000-0000-0000-0000-0000000000a1') s
    where s.starts_at = pg_temp.at_local('10:00')),
  'reserva cancelada libera o horário'
);

-- ---------------------------------------------------------------------------
-- Sinal: pré-reserva expira e libera o horário
-- ---------------------------------------------------------------------------
select is(
  (pg_temp.book('40000000-0000-0000-0000-0000000000a2', '30000000-0000-0000-0000-0000000000a1',
    pg_temp.at_local('15:00'), 'c6@teste.dev', '50000000-0000-0000-0000-000000000006') ->> 'deposit_cents'),
  '4000',
  'sinal de 50% calculado (R$ 40,00)'
);
select is(
  (select status::text from public.bookings where idempotency_key = '50000000-0000-0000-0000-000000000006'),
  'pending_payment',
  'serviço com sinal gera pré-reserva'
);
update public.bookings set hold_expires_at = now() - interval '1 minute'
where idempotency_key = '50000000-0000-0000-0000-000000000006';
select is(public.expire_pending_bookings(), 1, 'expira a pré-reserva vencida');
select ok(
  exists (select 1 from public.get_available_slots(
    '40000000-0000-0000-0000-0000000000a2', '20000000-0000-0000-0000-00000000000a',
    pg_temp.test_day(), pg_temp.test_day(), '30000000-0000-0000-0000-0000000000a1') s
    where s.starts_at = pg_temp.at_local('15:00')),
  'pré-reserva expirada libera o horário'
);

-- ---------------------------------------------------------------------------
-- Folgas e feriados
-- ---------------------------------------------------------------------------
insert into public.time_off (business_id, professional_id, starts_at, ends_at)
values ('10000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-0000000000a2',
        pg_temp.at_local('13:00'), pg_temp.at_local('18:00'));
select is(
  (select count(*) from public.get_available_slots(
    '40000000-0000-0000-0000-0000000000a1', '20000000-0000-0000-0000-00000000000a',
    pg_temp.test_day(), pg_temp.test_day(), '30000000-0000-0000-0000-0000000000a2') s
    where s.starts_at >= pg_temp.at_local('13:00')),
  0::bigint,
  'folga à tarde remove os horários da tarde'
);

insert into public.holidays (business_id, unit_id, date, name)
values ('10000000-0000-0000-0000-00000000000a', null, pg_temp.test_day(), 'Feriado');
select is(
  (select count(*) from public.get_available_slots(
    '40000000-0000-0000-0000-0000000000a1', '20000000-0000-0000-0000-00000000000a',
    pg_temp.test_day(), pg_temp.test_day())),
  0::bigint,
  'feriado fecha o dia inteiro'
);

-- ---------------------------------------------------------------------------
-- Antecedência mínima e janela máxima
-- ---------------------------------------------------------------------------
select ok(
  not exists (select 1 from public.get_available_slots(
    '40000000-0000-0000-0000-0000000000a1', '20000000-0000-0000-0000-00000000000a',
    current_date, current_date + 1) s
    where s.starts_at < now() + interval '60 minutes'),
  'antecedência mínima respeitada'
);
select is(
  (select count(*) from public.get_available_slots(
    '40000000-0000-0000-0000-0000000000a1', '20000000-0000-0000-0000-00000000000a',
    current_date + 61, current_date + 62)),
  0::bigint,
  'janela máxima (60 dias) respeitada'
);

select * from finish();
rollback;
