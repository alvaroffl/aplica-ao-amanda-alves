begin;
\ir ../helpers/fixtures.psql
select plan(14);

select is(
  (select count(*) from pg_tables where schemaname = 'public' and not rowsecurity),
  0::bigint,
  'RLS habilitada em TODAS as tabelas do esquema public'
);

select has_table('public', 'bookings', 'tabela de reservas existe');
select has_table('public', 'notifications', 'outbox de notificações existe');

select ok(
  exists (select 1 from pg_constraint where conname = 'bookings_no_overlap' and contype = 'x'),
  'exclusion constraint anti-double-booking existe'
);
select ok(
  exists (select 1 from pg_constraint where conname = 'bookings_idempotency_key' and contype = 'u'),
  'unicidade da chave de idempotência existe'
);

select ok(not has_table_privilege('anon', 'public.bookings', 'select'), 'anon não lê reservas');
select ok(not has_table_privilege('anon', 'public.clients', 'select'), 'anon não lê clientes');
select ok(not has_table_privilege('authenticated', 'public.payments', 'insert'), 'equipe não grava pagamentos');

select ok(
  not has_function_privilege('anon', 'public.create_booking(uuid,uuid,uuid,timestamptz,text,text,text,text,uuid,text)', 'execute'),
  'anon não chama create_booking direto (só via Edge Function com captcha/rate limit)'
);
select ok(
  has_function_privilege('anon', 'public.get_available_slots(uuid,uuid,date,date,uuid,uuid)', 'execute'),
  'anon consulta horários livres'
);
select ok(
  has_function_privilege('anon', 'public.get_public_business(text)', 'execute'),
  'anon lê a página pública do negócio'
);
select ok(
  not has_function_privilege('anon', 'public.check_rate_limit(text,integer,integer)', 'execute'),
  'anon não manipula rate limit'
);
select ok(
  not has_function_privilege('authenticated', 'public.claim_notifications(integer)', 'execute'),
  'equipe não acessa a fila do worker'
);

select is(
  (public.get_public_business('negocio-a') -> 'business' ->> 'name'),
  'Negócio A',
  'get_public_business retorna dados públicos'
);

select * from finish();
rollback;
