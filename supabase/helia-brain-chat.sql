-- Helia Admin Chat durable persistence (run in Supabase SQL editor once)
-- Required so Ctrl+R / cold starts keep conversation history.

create table if not exists public.helia_brain_conversations (
  id text primary key,
  user_id text not null,
  organization_id text not null,
  project_id text not null,
  title text not null,
  preview text,
  product text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.helia_brain_messages (
  id text primary key,
  conversation_id text not null references public.helia_brain_conversations(id) on delete cascade,
  user_id text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  timestamp timestamptz not null default now()
);

create index if not exists helia_brain_conversations_user_idx
  on public.helia_brain_conversations (user_id, updated_at desc);

create index if not exists helia_brain_messages_conv_idx
  on public.helia_brain_messages (conversation_id, timestamp asc);

alter table public.helia_brain_conversations enable row level security;
alter table public.helia_brain_messages enable row level security;

-- Service role bypasses RLS. If using anon key from server, allow all for these tables
-- (server still scopes by user_id in application code).
drop policy if exists helia_brain_conversations_server on public.helia_brain_conversations;
create policy helia_brain_conversations_server
  on public.helia_brain_conversations for all
  using (true) with check (true);

drop policy if exists helia_brain_messages_server on public.helia_brain_messages;
create policy helia_brain_messages_server
  on public.helia_brain_messages for all
  using (true) with check (true);
