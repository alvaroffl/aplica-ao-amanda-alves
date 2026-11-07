begin;
\ir ../helpers/fixtures.psql
select plan(14);

-- Uma reserva para cada profissional do negócio A e uma no negócio B
select pg_temp.book('40000000-0000-0000-0000-0000000000a1', '30000000-0000-0000-0000-0000000000a1', pg_temp.at_local('09:00'), 'x1@teste.dev');
select pg_temp.book('40000000-0000-0000-0000-0000000000a1', '30000000-0000-0000-0000-0000000000a2', pg_temp.at_local('09:00'), 'x2@teste.dev');
select public.create_booking('40000000-0000-0000-0000-0000000000b1', '20000000-0000-0000-0000-00000000000b', null,
  pg_temp.at_local('09:00'), 'Cliente B', 'xb@teste.dev', null, null, gen_random_uuid(), 'v1');

-- ---------------------------------------------------------------------------
-- Isolamento entre negócios
-- ---------------------------------------------------------------------------
set local role authenticated;
select pg_temp.login('b0000000-0000-0000-0000-000000000001');

select is((select count(*) from public.bookings where business_id = '10000000-0000-0000-0000-00000000000a'), 0::bigint,
  'admin do negócio B não vê reservas do A');
select is((select count(*) from public.clients where business_id = '10000000-0000-0000-0000-00000000000a'), 0::bigint,
  'admin do negócio B não vê clientes do A');
select is((select count(*) from public.bookings), 1::bigint, 'admin B vê só a própria reserva');
select throws_ok(
  $$ select public.report_summary('10000000-0000-0000-0000-00000000000a', current_date, current_date + 30) $$,
  '42501', 'FORBIDDEN', 'admin B não acessa relatório do A');

-- ---------------------------------------------------------------------------
-- Profissional vê apenas a própria agenda
-- ---------------------------------------------------------------------------
select pg_temp.login('a0000000-0000-0000-0000-000000000003');
select is((select count(*) from public.bookings), 1::bigint, 'profissional vê apenas as próprias reservas');
select is((select count(*) from public.clients), 1::bigint, 'profissional vê apenas os próprios clientes');
select throws_ok(
  $$ insert into public.availability_rules (business_id, professional_id, unit_id, weekday, start_time, end_time)
     values ('10000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-0000000000a2',
             '20000000-0000-0000-0000-00000000000a', 1, '19:00', '20:00') $$,
  '42501', null, 'profissional não altera a disponibilidade de colega');
select lives_ok(
  $$ insert into public.availability_rules (business_id, professional_id, unit_id, weekday, start_time, end_time)
     values ('10000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-0000000000a1',
             '20000000-0000-0000-0000-00000000000a', 1, '19:00', '20:00') $$,
  'profissional altera a própria disponibilidade');

-- ---------------------------------------------------------------------------
-- Recepção: vê toda a agenda, mas não mexe em configurações
-- ---------------------------------------------------------------------------
select pg_temp.login('a0000000-0000-0000-0000-000000000002');
select is((select count(*) from public.bookings), 2::bigint, 'recepção vê toda a agenda do negócio');
update public.services set price_cents = 1 where id = '40000000-0000-0000-0000-0000000000a1';
select throws_ok(
  $$ select public.lgpd_anonymize_client((select id from public.clients limit 1)) $$,
  '42501', 'FORBIDDEN', 'recepção não executa exclusão LGPD');

-- ---------------------------------------------------------------------------
-- Admin
-- ---------------------------------------------------------------------------
select pg_temp.login('a0000000-0000-0000-0000-000000000001');
select lives_ok(
  $$ select public.report_summary('10000000-0000-0000-0000-00000000000a', current_date, current_date + 30) $$,
  'admin acessa relatórios');

reset role;
select is((select price_cents from public.services where id = '40000000-0000-0000-0000-0000000000a1'), 10000,
  'update da recepção em serviços foi ignorado pela RLS');

-- ---------------------------------------------------------------------------
-- Anônimo
-- ---------------------------------------------------------------------------
set local role anon;
select throws_ok($$ select count(*) from public.bookings $$, '42501', null, 'anon não lê a tabela de reservas');
select throws_ok($$ select count(*) from public.clients $$, '42501', null, 'anon não lê a tabela de clientes');
reset role;

select * from finish();
rollback;
