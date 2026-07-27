-- Portal de Clientes LUMI Landing
-- Executar no Supabase SQL Editor

create table if not exists lumi_portal_users (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references lumi_clients(id) on delete cascade,
  name          text not null,
  email         text not null unique,
  password_hash text not null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists lumi_portal_users_client_id_idx on lumi_portal_users(client_id);
create index if not exists lumi_portal_users_email_idx     on lumi_portal_users(email);

-- RLS: acesso apenas via service role key (backend)
alter table lumi_portal_users enable row level security;
-- Nenhuma policy pública — todas as operações passam pelo service role no backend
