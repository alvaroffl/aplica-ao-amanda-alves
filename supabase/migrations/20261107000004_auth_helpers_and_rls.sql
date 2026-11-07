-- =============================================================================
-- 0004 · Funções de autorização e Row Level Security (RLS em TODAS as tabelas)
--
-- Papéis:
--   admin        → tudo no negócio
--   reception    → agenda, clientes e bloqueios de todos; lê configurações
--   professional → lê o negócio; gerencia a própria agenda e disponibilidade
-- =============================================================================

create or replace function public.is_member(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.business_members m
    where m.business_id = p_business_id and m.user_id = (select auth.uid())
  )
$$;

create or replace function public.has_role(p_business_id uuid, p_roles public.member_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.business_members m
    where m.business_id = p_business_id
      and m.user_id = (select auth.uid())
      and m.role = any (p_roles)
  )
$$;

create or replace function public.my_professional_id(p_business_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.id from public.professionals p
  where p.business_id = p_business_id and p.user_id = (select auth.uid())
  limit 1
$$;

-- Pode gerenciar a agenda deste profissional?
create or replace function public.can_manage_professional(p_business_id uuid, p_professional_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role(p_business_id, '{admin,reception}')
    or (
      public.has_role(p_business_id, '{professional}')
      and p_professional_id = public.my_professional_id(p_business_id)
    )
$$;

grant execute on function public.is_member(uuid) to authenticated;
grant execute on function public.has_role(uuid, public.member_role[]) to authenticated;
grant execute on function public.my_professional_id(uuid) to authenticated;
grant execute on function public.can_manage_professional(uuid, uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Novo usuário → perfil + aceite automático de convites pendentes
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), lower(new.email))
  on conflict (id) do nothing;

  insert into public.business_members (business_id, user_id, role)
  select i.business_id, new.id, i.role
  from public.invitations i
  where i.email = lower(new.email) and i.accepted_at is null
  on conflict do nothing;

  update public.professionals p
  set user_id = new.id
  from public.invitations i
  where i.email = lower(new.email)
    and i.accepted_at is null
    and i.professional_id = p.id
    and p.user_id is null;

  update public.invitations
  set accepted_at = now()
  where email = lower(new.email) and accepted_at is null;

  return new;
end
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Impede remover/rebaixar o último admin de um negócio.
create or replace function public.ensure_admin_remains()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business uuid := coalesce(old.business_id, new.business_id);
begin
  if exists (select 1 from public.businesses b where b.id = v_business)
     and not exists (
       select 1 from public.business_members m
       where m.business_id = v_business and m.role = 'admin'
     ) then
    raise exception 'LAST_ADMIN' using errcode = 'P0001',
      hint = 'O negócio precisa de pelo menos um administrador.';
  end if;
  return null;
end
$$;

create constraint trigger business_members_keep_admin
  after update or delete on public.business_members
  deferrable initially deferred
  for each row execute function public.ensure_admin_remains();

-- -----------------------------------------------------------------------------
-- Habilita RLS
-- -----------------------------------------------------------------------------
alter table public.businesses enable row level security;
alter table public.units enable row level security;
alter table public.profiles enable row level security;
alter table public.business_members enable row level security;
alter table public.professionals enable row level security;
alter table public.professional_units enable row level security;
alter table public.invitations enable row level security;
alter table public.services enable row level security;
alter table public.service_professionals enable row level security;
alter table public.availability_rules enable row level security;
alter table public.time_off enable row level security;
alter table public.holidays enable row level security;
alter table public.clients enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_log enable row level security;
alter table private.settings enable row level security;
alter table private.rate_limits enable row level security;

-- -----------------------------------------------------------------------------
-- businesses
-- -----------------------------------------------------------------------------
create policy "membros leem o negócio" on public.businesses
  for select to authenticated using (public.is_member(id));
create policy "admin atualiza o negócio" on public.businesses
  for update to authenticated
  using (public.has_role(id, '{admin}')) with check (public.has_role(id, '{admin}'));
create policy "admin exclui o negócio" on public.businesses
  for delete to authenticated using (public.has_role(id, '{admin}'));
-- criação: somente via public.create_business()

-- -----------------------------------------------------------------------------
-- Configuração do negócio: leitura por membros, escrita por admin
-- -----------------------------------------------------------------------------
create policy "membros leem unidades" on public.units
  for select to authenticated using (public.is_member(business_id));
create policy "admin gerencia unidades" on public.units
  for all to authenticated
  using (public.has_role(business_id, '{admin}'))
  with check (public.has_role(business_id, '{admin}'));

create policy "membros leem profissionais" on public.professionals
  for select to authenticated using (public.is_member(business_id));
create policy "admin gerencia profissionais" on public.professionals
  for all to authenticated
  using (public.has_role(business_id, '{admin}'))
  with check (public.has_role(business_id, '{admin}'));

create policy "membros leem vínculos de unidade" on public.professional_units
  for select to authenticated using (public.is_member(business_id));
create policy "admin gerencia vínculos de unidade" on public.professional_units
  for all to authenticated
  using (public.has_role(business_id, '{admin}'))
  with check (public.has_role(business_id, '{admin}'));

create policy "membros leem serviços" on public.services
  for select to authenticated using (public.is_member(business_id));
create policy "admin gerencia serviços" on public.services
  for all to authenticated
  using (public.has_role(business_id, '{admin}'))
  with check (public.has_role(business_id, '{admin}'));

create policy "membros leem serviço×profissional" on public.service_professionals
  for select to authenticated using (public.is_member(business_id));
create policy "admin gerencia serviço×profissional" on public.service_professionals
  for all to authenticated
  using (public.has_role(business_id, '{admin}'))
  with check (public.has_role(business_id, '{admin}'));

create policy "membros leem feriados" on public.holidays
  for select to authenticated using (public.is_member(business_id));
create policy "admin gerencia feriados" on public.holidays
  for all to authenticated
  using (public.has_role(business_id, '{admin}'))
  with check (public.has_role(business_id, '{admin}'));

-- -----------------------------------------------------------------------------
-- Disponibilidade: admin, ou o próprio profissional
-- -----------------------------------------------------------------------------
create policy "membros leem regras" on public.availability_rules
  for select to authenticated using (public.is_member(business_id));
create policy "admin ou o próprio profissional gerencia regras" on public.availability_rules
  for all to authenticated
  using (
    public.has_role(business_id, '{admin}')
    or professional_id = public.my_professional_id(business_id)
  )
  with check (
    public.has_role(business_id, '{admin}')
    or professional_id = public.my_professional_id(business_id)
  );

create policy "membros leem folgas" on public.time_off
  for select to authenticated using (public.is_member(business_id));
create policy "equipe autorizada gerencia folgas" on public.time_off
  for all to authenticated
  using (public.can_manage_professional(business_id, professional_id))
  with check (public.can_manage_professional(business_id, professional_id));

-- -----------------------------------------------------------------------------
-- Perfis, membros e convites
-- -----------------------------------------------------------------------------
create policy "usuário lê o próprio perfil e de colegas" on public.profiles
  for select to authenticated using (
    id = (select auth.uid())
    or exists (
      select 1 from public.business_members mine
      join public.business_members theirs on theirs.business_id = mine.business_id
      where mine.user_id = (select auth.uid()) and theirs.user_id = profiles.id
    )
  );
create policy "usuário atualiza o próprio perfil" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "membros leem a equipe" on public.business_members
  for select to authenticated using (public.is_member(business_id));
create policy "admin gerencia a equipe" on public.business_members
  for all to authenticated
  using (public.has_role(business_id, '{admin}'))
  with check (public.has_role(business_id, '{admin}'));

create policy "admin gerencia convites" on public.invitations
  for all to authenticated
  using (public.has_role(business_id, '{admin}'))
  with check (public.has_role(business_id, '{admin}'));

-- -----------------------------------------------------------------------------
-- Clientes: admin/recepção veem todos; profissional vê quem já atendeu/vai atender
-- -----------------------------------------------------------------------------
create policy "equipe lê clientes" on public.clients
  for select to authenticated using (
    public.has_role(business_id, '{admin,reception}')
    or exists (
      select 1 from public.bookings b
      where b.client_id = clients.id
        and b.professional_id = public.my_professional_id(clients.business_id)
    )
  );
create policy "admin e recepção criam clientes" on public.clients
  for insert to authenticated
  with check (public.has_role(business_id, '{admin,reception}'));
create policy "admin e recepção editam clientes" on public.clients
  for update to authenticated
  using (public.has_role(business_id, '{admin,reception}'))
  with check (public.has_role(business_id, '{admin,reception}'));
-- exclusão: somente anonimização via LGPD (public.lgpd_anonymize_client)

-- -----------------------------------------------------------------------------
-- Reservas
-- -----------------------------------------------------------------------------
create policy "equipe lê reservas" on public.bookings
  for select to authenticated using (
    public.can_manage_professional(business_id, professional_id)
  );
create policy "equipe cria reservas" on public.bookings
  for insert to authenticated with check (
    public.can_manage_professional(business_id, professional_id)
  );
create policy "equipe edita reservas" on public.bookings
  for update to authenticated
  using (public.can_manage_professional(business_id, professional_id))
  with check (public.can_manage_professional(business_id, professional_id));
-- sem DELETE: reservas são canceladas, nunca apagadas (auditoria)

-- -----------------------------------------------------------------------------
-- Pagamentos, notificações e auditoria: somente leitura para a equipe.
-- Escrita apenas pelo backend (service_role) e funções SECURITY DEFINER.
-- -----------------------------------------------------------------------------
create policy "admin e recepção leem pagamentos" on public.payments
  for select to authenticated using (public.has_role(business_id, '{admin,reception}'));

create policy "admin e recepção leem notificações" on public.notifications
  for select to authenticated using (public.has_role(business_id, '{admin,reception}'));

create policy "admin lê auditoria" on public.audit_log
  for select to authenticated using (public.has_role(business_id, '{admin}'));

-- private.* não tem políticas: inacessível fora de funções SECURITY DEFINER.

-- -----------------------------------------------------------------------------
-- Privilégios de tabela (defesa em profundidade, além da RLS)
-- -----------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
revoke insert, update, delete on public.payments, public.notifications, public.audit_log
  from authenticated;
revoke insert, delete on public.profiles from authenticated;
