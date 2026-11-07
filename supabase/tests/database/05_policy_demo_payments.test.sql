begin;
\ir ../helpers/fixtures.psql
select plan(26);

-- ---------------------------------------------------------------------------
-- Política padrão e RLS da política
-- ---------------------------------------------------------------------------
select is(
  (select count(*) from public.booking_policies
   where business_id in ('10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000b')),
  2::bigint,
  'todo negócio novo nasce com a política padrão'
);

set local role anon;
select throws_ok('select * from public.booking_policies', '42501', null, 'anônimo não lê a política');
reset role;

set local role authenticated;
select pg_temp.login('b0000000-0000-0000-0000-000000000001');
select is(
  (select count(*) from public.booking_policies where business_id = '10000000-0000-0000-0000-00000000000a'),
  0::bigint,
  'admin de outro negócio não vê a política'
);
select pg_temp.login('a0000000-0000-0000-0000-000000000002');
update public.booking_policies set refund_percent = 0 where business_id = '10000000-0000-0000-0000-00000000000a';
reset role;
select is(
  (select refund_percent from public.booking_policies where business_id = '10000000-0000-0000-0000-00000000000a'),
  100,
  'recepção não altera a política'
);

-- ---------------------------------------------------------------------------
-- Regras: remarcação e reembolso com janelas e percentual próprios
-- ---------------------------------------------------------------------------
create temp table ctx as
select pg_temp.book('40000000-0000-0000-0000-0000000000a2', '30000000-0000-0000-0000-0000000000a1',
  pg_temp.at_local('09:00'), 'politica@teste.dev') as b;
insert into public.payments (id, business_id, booking_id, provider, method, amount_cents)
select '61000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-00000000000a', (b ->> 'id')::uuid, 'fake', 'pix', 4000 from ctx;
select is(
  public.confirm_payment('61000000-0000-0000-0000-000000000001', 'mp-1',
    '{"payment_type_id":"credit_card","installments":3}'),
  'confirmed',
  'sinal aprovado confirma a reserva'
);
select is(
  (select method_detail || ':' || installments from public.payments where id = '61000000-0000-0000-0000-000000000001'),
  'credit_card:3',
  'guarda o tipo de cartão e as parcelas informados pelo provedor'
);

-- Remarcação só até 30 dias antes (fora da janela); reembolso até 1h antes, 50%.
set local role authenticated;
select pg_temp.login('a0000000-0000-0000-0000-000000000001');
update public.booking_policies
set reschedule_min_hours = 720, refund_min_hours = 1, refund_percent = 50
where business_id = '10000000-0000-0000-0000-00000000000a';
reset role;

select is(
  (public.get_booking_by_token((select b ->> 'manage_token' from ctx)) -> 'policy' ->> 'can_reschedule')::boolean,
  false,
  'fora da janela de remarcação a cliente não remarca'
);
select throws_ok(
  format('select public.reschedule_booking_by_token(%L, %L)',
    (select b ->> 'manage_token' from ctx), pg_temp.at_local('14:00')),
  'P0001', 'OUTSIDE_POLICY_WINDOW', 'remarcação fora da janela é recusada no servidor'
);
select is(
  (public.get_booking_by_token((select b ->> 'manage_token' from ctx)) -> 'policy' ->> 'refund_eligible')::boolean,
  true,
  'dentro da janela de reembolso'
);
select is(
  public.cancel_booking_by_token((select b ->> 'manage_token' from ctx)) ->> 'refund',
  'true',
  'cancelamento dentro da janela informa o reembolso'
);
select is(
  (select status::text || ':' || refund_requested_cents from public.payments
   where id = '61000000-0000-0000-0000-000000000001'),
  'refund_pending:2000',
  'estorno parcial de 50% enfileirado'
);
select public.complete_refund('61000000-0000-0000-0000-000000000001', true);
select is(
  (select status::text || ':' || refunded_cents from public.payments
   where id = '61000000-0000-0000-0000-000000000001'),
  'refunded:2000',
  'estorno concluído registra o valor parcial'
);

-- Fora da janela de reembolso: sinal retido.
update public.booking_policies set refund_min_hours = 720, refund_percent = 100
where business_id = '10000000-0000-0000-0000-00000000000a';
create temp table late as
select pg_temp.book('40000000-0000-0000-0000-0000000000a2', '30000000-0000-0000-0000-0000000000a1',
  pg_temp.at_local('10:00'), 'tarde@teste.dev') as b;
insert into public.payments (id, business_id, booking_id, provider, method, amount_cents, status)
select '61000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-00000000000a', (b ->> 'id')::uuid, 'fake', 'pix', 4000, 'pending' from late;
select public.confirm_payment('61000000-0000-0000-0000-000000000002', 'mp-2');
select is(
  public.cancel_booking_by_token((select b ->> 'manage_token' from late)) ->> 'refund',
  'false',
  'fora da janela de reembolso o sinal não volta'
);
select is(
  (select status::text from public.payments where id = '61000000-0000-0000-0000-000000000002'),
  'approved',
  'pagamento fica retido'
);

-- Cancelamento pela cliente desativado.
update public.booking_policies set client_can_cancel = false
where business_id = '10000000-0000-0000-0000-00000000000a';
create temp table locked as
select pg_temp.book('40000000-0000-0000-0000-0000000000a1', '30000000-0000-0000-0000-0000000000a1',
  pg_temp.at_local('15:00'), 'travado@teste.dev') as b;
select throws_ok(
  format('select public.cancel_booking_by_token(%L)', (select b ->> 'manage_token' from locked)),
  'P0001', 'CANCEL_NOT_ALLOWED', 'cliente não cancela sozinha quando a política não permite'
);

-- ---------------------------------------------------------------------------
-- Reembolso pelo painel (somente admin)
-- ---------------------------------------------------------------------------
set local role authenticated;
select pg_temp.login('a0000000-0000-0000-0000-000000000002');
select throws_ok(
  $$select public.panel_refund_payment('61000000-0000-0000-0000-000000000002')$$,
  '42501', 'FORBIDDEN', 'recepção não estorna'
);
select pg_temp.login('b0000000-0000-0000-0000-000000000001');
select throws_ok(
  $$select public.panel_refund_payment('61000000-0000-0000-0000-000000000002')$$,
  '42501', 'FORBIDDEN', 'admin de outro negócio não estorna'
);
select pg_temp.login('a0000000-0000-0000-0000-000000000001');
select throws_ok(
  $$select public.panel_refund_payment('61000000-0000-0000-0000-000000000002', 999999)$$,
  'P0001', 'INVALID_REFUND_AMOUNT', 'valor acima do pago é recusado'
);
select lives_ok(
  $$select public.panel_refund_payment('61000000-0000-0000-0000-000000000002', 1500)$$,
  'admin pede estorno parcial'
);
reset role;
select is(
  (select status::text || ':' || refund_requested_cents from public.payments
   where id = '61000000-0000-0000-0000-000000000002'),
  'refund_pending:1500',
  'estorno do painel entra na fila com o valor pedido'
);

-- ---------------------------------------------------------------------------
-- Dados de demonstração
-- ---------------------------------------------------------------------------
update public.services set is_demo = true where id = '40000000-0000-0000-0000-0000000000a2';
update public.booking_policies set is_demo = true where business_id = '10000000-0000-0000-0000-00000000000a';

set local role authenticated;
select pg_temp.login('a0000000-0000-0000-0000-000000000002');
select is(
  public.business_has_demo_data('10000000-0000-0000-0000-00000000000a'),
  true,
  'painel sabe que há dados de demonstração'
);
select throws_ok(
  $$select public.purge_demo_data('10000000-0000-0000-0000-00000000000a')$$,
  '42501', 'FORBIDDEN', 'só admin remove os dados de demonstração'
);
select pg_temp.login('a0000000-0000-0000-0000-000000000001');
select lives_ok(
  $$select public.purge_demo_data('10000000-0000-0000-0000-00000000000a')$$,
  'admin remove os dados de demonstração'
);
select is(
  public.business_has_demo_data('10000000-0000-0000-0000-00000000000a'),
  false,
  'nenhum dado de demonstração restante'
);
reset role;

select is(
  (select count(*) from public.bookings where service_id = '40000000-0000-0000-0000-0000000000a2'),
  0::bigint,
  'reservas feitas em serviços de demonstração saem junto'
);
select is(
  (select reschedule_min_hours || '/' || refund_min_hours || '/' || refund_percent || '/' || is_demo
   from public.booking_policies where business_id = '10000000-0000-0000-0000-00000000000a'),
  '24/24/100/false',
  'política volta ao padrão'
);

select * from finish();
rollback;
