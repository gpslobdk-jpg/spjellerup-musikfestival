create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'festival-memories',
  'festival-memories',
  true,
  5242880,
  array['image/avif', 'image/gif', 'image/heic', 'image/heif', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.festival_memories (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  public_url text not null,
  file_size integer,
  mime_type text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 days'),
  consent_accepted boolean not null default false
);

create index if not exists festival_memories_created_at_idx on public.festival_memories (created_at desc);
create index if not exists festival_memories_expires_at_idx on public.festival_memories (expires_at);

alter table public.festival_memories enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant select on public.festival_memories to anon, authenticated;
grant all on table public.festival_memories to service_role;

drop policy if exists "festival_memories_select_unexpired" on public.festival_memories;
create policy "festival_memories_select_unexpired"
  on public.festival_memories
  for select
  to anon, authenticated
  using (expires_at > now());

-- If your project uses the Data API exposure controls for public tables,
-- make sure public.festival_memories is exposed in the Supabase dashboard.