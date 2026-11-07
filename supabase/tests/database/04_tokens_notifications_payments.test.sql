begin;
\ir ../helpers/fixtures.psql
select plan(22);

create temp table ctx as
select pg_temp.book('40000000-0000-0000-0000-0000000000a1', '30000000-0000-0000-0000-0000000000a1',
  pg_temp.at_local('10:00'), 'token@teste.dev') as b;

-- ---------------------------------------------------------------------------
-- Link seguro
-- ---------------------------------------------------------------------------
select is(
  public.get_booking_by_token((select b ->> 'manage_token' from ctx)) ->> 'id',
  (select b ->> 'id' from ctx),
  'token válido abre a reserva'
);
select is(
  public.get_booking_by_token(overlay((select b ->> 'manage_token' from ctx) placing 'ffff' from 40 for 4)),
  null,
  'token adulterado é rejeitado'
);
select is(public.get_booking_by_token('qualquer-coisa'), null, 'token malformado é rejeitado');

-- ---------------------------------------------------------------------------
-- Notificações enfileiradas na mesma transação
-- ---------------------------------------------------------------------------
select is(
  (select count(*) from public.notifications where booking_id = (select (b ->> 'id')::uuid from ctx)
     and template = 'booking_confirmed' and channel = 'email'),
  1::bigint,
  'confirmação por e-mail enfileirada'
);
select is(
  (select array_agg(template order by template) from public.notifications
   where booking_id = (select (b ->> 'id')::uuid from ctx) and template like 'reminder%'),
  array['reminder_24h', 'reminder_2h'],
  'lembretes de 24h e 2h agendados'
);
select is(
  (select scheduled_for from public.notifications
   where booking_id = (select (b ->> 'id')::uuid from ctx) and template = 'reminder_24h'),
  pg_temp.at_local('10:00') - interval '24 hours',
  'lembrete de 24h no horário certo'
);
select is(
  (select count(*) from public.notifications where booking_id = (select (b ->> 'id')::uuid from ctx) and channel = 'whatsapp'),
  0::bigint,
  'WhatsApp desligado no negócio → nada enfileirado nesse canal'
);

-- ---------------------------------------------------------------------------
-- Reagendamento pelo link
-- ---------------------------------------------------------------------------
select is(
  public.reschedule_booking_by_token((select b ->> 'manage_token' from ctx), pg_temp.at_local('14:00')) ->> 'starts_at',
  to_jsonb(pg_temp.at_local('14:00')) #>> '{}',
  'reagendamento pelo link'
);
select is(
  (select count(*) from public.notifications
   where booking_id = (select (b ->> 'id')::uuid from ctx) and template like 'reminder%' and status = 'cancelled'),
  2::bigint,
  'lembretes antigos cancelados'
);
select is(
  (select count(*) from public.notifications
   where booking_id = (select (b ->> 'id')::uuid from ctx) and template like 'reminder%' and status = 'pending'),
  2::bigint,
  'novos lembretes criados'
);
select throws_ok(
  format($$ select public.reschedule_booking_by_token(%L, %L::timestamptz) $$,
    (select b ->> 'manage_token' from ctx), pg_temp.at_local('12:30')),
  'P0001', 'SLOT_UNAVAILABLE',
  'não reagenda para horário fora da disponibilidade'
);

-- ---------------------------------------------------------------------------
-- Fila do worker: claim + retry com backoff
-- ---------------------------------------------------------------------------
select ok((select count(*) from public.claim_notifications(50)) >= 1, 'worker reivindica notificações vencidas');
select is(
  (select count(*) from public.notifications
   where business_id = '10000000-0000-0000-0000-00000000000a' and status = 'processing'),
  (select count(*) from public.notifications
   where business_id = '10000000-0000-0000-0000-00000000000a' and attempts = 1),
  'itens reivindicados ficam em processamento'
);
select public.complete_notification(
  (select id from public.notifications
   where business_id = '10000000-0000-0000-0000-00000000000a' and status = 'processing' limit 1),
  'failed', 'timeout');
select is(
  (select count(*) from public.notifications
   where business_id = '10000000-0000-0000-0000-00000000000a'
     and status = 'pending' and last_error = 'timeout' and scheduled_for > now()),
  1::bigint,
  'falha volta para a fila com backoff'
);

-- ---------------------------------------------------------------------------
-- Cancelamento pelo link (dentro do prazo → estorno)
-- ---------------------------------------------------------------------------
select is(
  public.cancel_booking_by_token((select b ->> 'manage_token' from ctx), 'imprevisto') ->> 'refund',
  'true',
  'cancelamento dentro do prazo dá direito a estorno'
);
select is(
  (select count(*) from public.notifications
   where booking_id = (select (b ->> 'id')::uuid from ctx) and template = 'booking_cancelled'),
  1::bigint,
  'aviso de cancelamento enfileirado'
);

-- ---------------------------------------------------------------------------
-- Pagamento: confirmação idempotente pelo webhook
-- ---------------------------------------------------------------------------
create temp table pay as
select pg_temp.book('40000000-0000-0000-0000-0000000000a2', '30000000-0000-0000-0000-0000000000a1',
  pg_temp.at_local('16:00'), 'pix@teste.dev') as b;
insert into public.payments (id, business_id, booking_id, provider, method, amount_cents)
select '60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-00000000000a', (b ->> 'id')::uuid, 'fake', 'pix', 4000 from pay;

select is(public.confirm_payment('60000000-0000-0000-0000-000000000001', 'pix-123'), 'confirmed', 'pagamento aprovado confirma a reserva');
select is(public.confirm_payment('60000000-0000-0000-0000-000000000001', 'pix-123'), 'already_processed', 'webhook repetido é idempotente');
select is(
  (select status::text from public.bookings where id = (select (b ->> 'id')::uuid from pay)),
  'confirmed',
  'reserva confirmada após o pagamento'
);

-- ---------------------------------------------------------------------------
-- LGPD pelo link: anonimiza e invalida o token
-- ---------------------------------------------------------------------------
select public.lgpd_delete_by_token((select b ->> 'manage_token' from pay));
select is(
  (select name from public.clients where id = (select client_id from public.bookings where id = (select (b ->> 'id')::uuid from pay))),
  'Cliente removido',
  'cliente anonimizado'
);
select is(public.get_booking_by_token((select b ->> 'manage_token' from pay)), null, 'links antigos deixam de funcionar');

-- ---------------------------------------------------------------------------
-- Privacidade: mesmo telefone com e-mails diferentes = clientes diferentes
-- ---------------------------------------------------------------------------
select pg_temp.book('40000000-0000-0000-0000-0000000000a1', '30000000-0000-0000-0000-0000000000a2', pg_temp.at_local('09:00'), 'pessoa1@teste.dev');
select pg_temp.book('40000000-0000-0000-0000-0000000000a1', '30000000-0000-0000-0000-0000000000a2', pg_temp.at_local('14:00'), 'pessoa2@teste.dev');
select is(
  (select count(distinct client_id) from public.bookings b join public.clients c on c.id = b.client_id
   where c.email in ('pessoa1@teste.dev', 'pessoa2@teste.dev')),
  2::bigint,
  'mesmo telefone com e-mails diferentes não mistura clientes'
);

select * from finish();
rollback;
