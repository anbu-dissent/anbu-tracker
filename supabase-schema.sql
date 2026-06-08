-- =====================================================================
-- Anbu Protein Tracker — Supabase schema
-- Run this ONCE in your Supabase project:  SQL Editor → New query → paste → Run
-- =====================================================================

-- 1) Meta document (settings, food library, weekly plan, shopping list)
create table if not exists public.app_meta (
  user_key    text primary key,
  payload     jsonb not null,
  updated_at  text  not null,
  modified    timestamptz default now()
);

-- 2) Per-day documents (food log, gym, water, weight)
create table if not exists public.app_days (
  user_key    text not null,
  date        text not null,
  payload     jsonb not null,
  updated_at  text  not null,
  modified    timestamptz default now(),
  primary key (user_key, date)
);

-- 3) Real-time: broadcast changes to other devices
alter publication supabase_realtime add table public.app_meta;
alter publication supabase_realtime add table public.app_days;

-- 4) Row Level Security.
--    This is a single-user personal app. We enable RLS and allow access
--    to anyone holding the anon key (i.e. the app). Your data is namespaced
--    by your secret "Sync ID" (user_key). Keep that ID private and it acts
--    as your password. If you want stronger isolation later, switch to
--    Supabase Auth and scope policies to auth.uid().
alter table public.app_meta enable row level security;
alter table public.app_days enable row level security;

drop policy if exists meta_all on public.app_meta;
drop policy if exists days_all on public.app_days;

create policy meta_all on public.app_meta
  for all to anon, authenticated using (true) with check (true);
create policy days_all on public.app_days
  for all to anon, authenticated using (true) with check (true);

-- Done. Copy your Project URL + anon public key (Project Settings → API)
-- into the app's More → Cloud sync screen, using the SAME Sync ID on every device.
