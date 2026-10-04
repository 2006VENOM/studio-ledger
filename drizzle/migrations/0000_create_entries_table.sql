create table public.entries (
  id uuid primary key,
  user_id uuid not null,
  category text not null,
  entry_date date not null,
  description text not null,
  qty numeric not null default 1 check (qty > 0),
  unit_price numeric not null default 0 check (unit_price >= 0),
  created_at timestamptz not null default now()
);

create index entries_user_date_idx on public.entries (user_id, entry_date desc);

grant select, insert, update, delete on public.entries to authenticated;
grant all on public.entries to service_role;

alter table public.entries enable row level security;

create policy "Users manage their own entries"
  on public.entries
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);