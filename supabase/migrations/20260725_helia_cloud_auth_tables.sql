/**
 * Helia Cloud auth + tenant tables (idempotent).
 *
 * Production currently has brain chat + leads only.
 * Run this in the Supabase SQL editor to create the missing Cloud tables
 * expected by SupabaseCollectionStore / AuthService.
 *
 * Canonical full schema (includes unused brain_*_meta placeholders):
 *   supabase/helia-cloud.sql
 *
 * Brain SoT (already present in production — safe to skip):
 *   supabase/helia-brain-chat.sql
 *
 * Design notes (matches application code):
 * - Document-store shape: id + jsonb payload + updated_at
 * - Domain fields live inside payload (CloudUser, CloudSession, …)
 * - No relational FKs between Cloud collections (app enforces links in TS)
 * - Unique email via expression index on lower(payload->>'email')
 */

-- Users (register / login source of truth)
create table if not exists public.helia_users (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
create unique index if not exists helia_users_email_uidx
  on public.helia_users ((lower(payload->>'email')));

-- Sessions (refresh tokens)
create table if not exists public.helia_sessions (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists helia_sessions_user_idx
  on public.helia_sessions ((payload->>'userId'));

-- Organizations
create table if not exists public.helia_organizations (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

-- Memberships
create table if not exists public.helia_memberships (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists helia_memberships_user_idx
  on public.helia_memberships ((payload->>'userId'));

-- Projects
create table if not exists public.helia_projects (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists helia_projects_org_idx
  on public.helia_projects ((payload->>'organizationId'));

-- API Keys
create table if not exists public.helia_api_keys (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists helia_api_keys_org_idx
  on public.helia_api_keys ((payload->>'organizationId'));
create index if not exists helia_api_keys_prefix_idx
  on public.helia_api_keys ((payload->>'prefix'));

-- Subscriptions
create table if not exists public.helia_subscriptions (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

-- Usage buckets
create table if not exists public.helia_usage (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

-- Audit logs
create table if not exists public.helia_audit_logs (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

-- Admin settings
create table if not exists public.helia_admin_settings (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

-- RLS: service role bypasses; policies allow server access when using anon key.
alter table public.helia_users enable row level security;
alter table public.helia_sessions enable row level security;
alter table public.helia_organizations enable row level security;
alter table public.helia_memberships enable row level security;
alter table public.helia_projects enable row level security;
alter table public.helia_api_keys enable row level security;
alter table public.helia_subscriptions enable row level security;
alter table public.helia_usage enable row level security;
alter table public.helia_audit_logs enable row level security;
alter table public.helia_admin_settings enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'helia_users',
    'helia_sessions',
    'helia_organizations',
    'helia_memberships',
    'helia_projects',
    'helia_api_keys',
    'helia_subscriptions',
    'helia_usage',
    'helia_audit_logs',
    'helia_admin_settings'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_server', t);
    execute format(
      'create policy %I on public.%I for all using (true) with check (true)',
      t || '_server',
      t
    );
  end loop;
end $$;
