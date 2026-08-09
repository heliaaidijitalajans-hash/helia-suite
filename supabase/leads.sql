-- Public lead form storage (homepage demo request).
-- Run once in Supabase SQL editor if the table or insert policy is missing.

create table if not exists public.leads (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null,
  service text,
  message text,
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

-- Anon / authenticated inserts for the marketing form (or use service role server-side).
drop policy if exists leads_insert_public on public.leads;
create policy leads_insert_public
  on public.leads
  for insert
  to anon, authenticated
  with check (true);

-- Optional: allow service role full access via bypass; no select policy for anon
-- keeps submissions private from the browser.
