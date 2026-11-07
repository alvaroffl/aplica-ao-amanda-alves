-- =============================================================================
-- 0002 · Negócios, unidades, equipe, serviços, disponibilidade e clientes
-- Convenção: toda tabela de "inquilino" tem business_id, e as relações usam
-- chaves estrangeiras compostas (business_id, id) para impedir, no banco,
-- referências cruzadas entre negócios diferentes.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Negócios
-- -----------------------------------------------------------------------------
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  description text,
  logo_url text,
  phone text,
  email text,
  timezone text not null default 'America/Sao_Paulo',
  locale text not null default 'pt-BR',
  currency text not null default 'BRL',
  -- granularidade dos horários oferecidos (ex.: 30 → 09:00, 09:30, 10:00…)
  slot_interval_min integer not null default 30,
  -- antecedência mínima (horas) para o cliente cancelar com estorno ou reagendar
  cancellation_window_hours integer not null default 24,
  -- minutos que uma pré-reserva aguarda o pagamento do sinal
  booking_hold_min integer not null default 15,
  reminder_24h boolean not null default true,
  reminder_2h boolean not null default true,
  whatsapp_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint businesses_slug_key unique (slug),
  constraint businesses_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$'),
  constraint businesses_slug_reserved check (slug not in (
    'painel', 'entrar', 'cadastro', 'r', 'auth', 'api', 'app', 'admin', 'assets', 'static',
    'recuperar-senha', 'redefinir-senha', 'termos', 'privacidade', 'sobre', 'ajuda', 'reserva'
  )),
  constraint businesses_name_len check (char_length(name) between 2 and 120),
  constraint businesses_description_len check (description is null or char_length(description) <= 1000),
  constraint businesses_timezone_valid check (public.is_valid_timezone(timezone)),
  constraint businesses_slot_interval check (slot_interval_min between 5 and 240),
  constraint businesses_cancellation_window check (cancellation_window_hours between 0 and 720),
  constraint businesses_hold check (booking_hold_min between 5 and 120)
);

create trigger businesses_updated_at before update on public.businesses
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Unidades
-- -----------------------------------------------------------------------------
create table public.units (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  slug text not null,
  address text,
  phone text,
  timezone text not null default 'America/Sao_Paulo',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint units_business_id_id_key unique (business_id, id),
  constraint units_business_slug_key unique (business_id, slug),
  constraint units_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{0,46}[a-z0-9]$|^[a-z0-9]$'),
  constraint units_name_len check (char_length(name) between 1 and 120),
  constraint units_timezone_valid check (public.is_valid_timezone(timezone))
);

-- -----------------------------------------------------------------------------
-- Perfis de usuário (espelho público mínimo de auth.users)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Membros e papéis
-- -----------------------------------------------------------------------------
create table public.business_members (
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null,
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

create index business_members_user_idx on public.business_members (user_id);

-- -----------------------------------------------------------------------------
-- Profissionais
-- -----------------------------------------------------------------------------
create table public.professionals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  name text not null,
  bio text,
  avatar_url text,
  color text not null default '#6366f1',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint professionals_business_id_id_key unique (business_id, id),
  constraint professionals_business_user_key unique (business_id, user_id),
  constraint professionals_name_len check (char_length(name) between 1 and 120),
  constraint professionals_color_hex check (color ~ '^#[0-9a-fA-F]{6}$')
);

create table public.professional_units (
  business_id uuid not null,
  professional_id uuid not null,
  unit_id uuid not null,
  primary key (professional_id, unit_id),
  foreign key (business_id, professional_id)
    references public.professionals (business_id, id) on delete cascade,
  foreign key (business_id, unit_id)
    references public.units (business_id, id) on delete cascade
);

create index professional_units_unit_idx on public.professional_units (unit_id);

-- -----------------------------------------------------------------------------
-- Convites (membro ainda sem conta)
-- -----------------------------------------------------------------------------
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  email text not null,
  role public.member_role not null,
  professional_id uuid,
  invited_by uuid references auth.users (id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint invitations_email_lower check (email = lower(email)),
  foreign key (business_id, professional_id)
    references public.professionals (business_id, id) on delete cascade
);

create unique index invitations_pending_email_key
  on public.invitations (business_id, email) where accepted_at is null;

-- -----------------------------------------------------------------------------
-- Serviços
-- -----------------------------------------------------------------------------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  description text,
  category text,
  duration_min integer not null,
  price_cents integer not null default 0,
  buffer_before_min integer not null default 0,
  buffer_after_min integer not null default 0,
  min_notice_min integer not null default 60,
  max_advance_days integer not null default 60,
  deposit_type public.deposit_type not null default 'none',
  -- centavos quando 'fixed'; porcentagem (1–100) quando 'percent'
  deposit_value integer not null default 0,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint services_business_id_id_key unique (business_id, id),
  constraint services_name_len check (char_length(name) between 1 and 120),
  constraint services_duration check (duration_min between 5 and 720),
  constraint services_price check (price_cents >= 0),
  constraint services_buffers check (
    buffer_before_min between 0 and 240 and buffer_after_min between 0 and 240
  ),
  constraint services_notice check (min_notice_min between 0 and 43200),
  constraint services_advance check (max_advance_days between 1 and 365),
  constraint services_deposit check (
    (deposit_type = 'none' and deposit_value = 0)
    or (deposit_type = 'fixed' and deposit_value > 0)
    or (deposit_type = 'percent' and deposit_value between 1 and 100)
  )
);

create trigger services_updated_at before update on public.services
  for each row execute function public.set_updated_at();

create table public.service_professionals (
  business_id uuid not null,
  service_id uuid not null,
  professional_id uuid not null,
  primary key (service_id, professional_id),
  foreign key (business_id, service_id)
    references public.services (business_id, id) on delete cascade,
  foreign key (business_id, professional_id)
    references public.professionals (business_id, id) on delete cascade
);

create index service_professionals_professional_idx
  on public.service_professionals (professional_id);

-- -----------------------------------------------------------------------------
-- Disponibilidade
-- -----------------------------------------------------------------------------

-- Regra semanal: hora local da unidade. Vários intervalos por dia = pausas.
create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  professional_id uuid not null,
  unit_id uuid not null,
  weekday smallint not null, -- 0 = domingo … 6 = sábado
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  constraint availability_rules_weekday check (weekday between 0 and 6),
  constraint availability_rules_range check (end_time > start_time),
  foreign key (business_id, professional_id)
    references public.professionals (business_id, id) on delete cascade,
  foreign key (business_id, unit_id)
    references public.units (business_id, id) on delete cascade,
  -- um profissional não pode ter dois intervalos sobrepostos no mesmo dia,
  -- nem estar em duas unidades ao mesmo tempo.
  constraint availability_rules_no_overlap exclude using gist (
    professional_id with =,
    weekday with =,
    public.timerange(start_time, end_time, '[)') with &&
  )
);

create index availability_rules_lookup_idx
  on public.availability_rules (unit_id, weekday, professional_id);

-- Folgas e bloqueios pontuais de um profissional.
create table public.time_off (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  professional_id uuid not null,
  kind public.time_off_kind not null default 'time_off',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint time_off_range check (ends_at > starts_at),
  foreign key (business_id, professional_id)
    references public.professionals (business_id, id) on delete cascade
);

create index time_off_professional_range_idx
  on public.time_off using gist (professional_id, tstzrange(starts_at, ends_at, '[)'));

-- Feriados: fecham o negócio inteiro (unit_id nulo) ou uma unidade.
create table public.holidays (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  unit_id uuid,
  date date not null,
  name text not null,
  created_at timestamptz not null default now(),
  constraint holidays_unique unique nulls not distinct (business_id, unit_id, date),
  foreign key (business_id, unit_id)
    references public.units (business_id, id) on delete cascade
);

-- -----------------------------------------------------------------------------
-- Clientes
-- -----------------------------------------------------------------------------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  email text,
  phone text, -- E.164 (+5511999998888)
  notes text, -- observações internas
  user_id uuid references auth.users (id) on delete set null,
  consent_at timestamptz,
  consent_version text,
  anonymized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clients_business_id_id_key unique (business_id, id),
  constraint clients_name_len check (char_length(name) between 1 and 120),
  constraint clients_email_lower check (email is null or email = lower(email)),
  constraint clients_phone_e164 check (phone is null or phone ~ '^\+[1-9][0-9]{7,14}$')
);

create unique index clients_business_email_key
  on public.clients (business_id, email) where email is not null;
create index clients_business_phone_idx on public.clients (business_id, phone);
create index clients_business_name_idx on public.clients (business_id, lower(name));

create trigger clients_updated_at before update on public.clients
  for each row execute function public.set_updated_at();
