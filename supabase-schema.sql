create table if not exists public.war_rooms (
  room_code text primary key,
  state jsonb not null,
  updated_by text not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.war_rooms enable row level security;

drop policy if exists "public rooms can be read" on public.war_rooms;
create policy "public rooms can be read"
  on public.war_rooms
  for select
  using (true);

drop policy if exists "public rooms can be created" on public.war_rooms;
create policy "public rooms can be created"
  on public.war_rooms
  for insert
  with check (true);

drop policy if exists "public rooms can be updated" on public.war_rooms;
create policy "public rooms can be updated"
  on public.war_rooms
  for update
  using (true)
  with check (true);

alter publication supabase_realtime add table public.war_rooms;
