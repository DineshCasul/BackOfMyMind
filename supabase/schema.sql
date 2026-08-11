-- Dreamscape ("back of my mind"), Phase 1 schema.
-- Run this once in your Supabase project's SQL editor.
-- Covers: profiles, dreams (private-by-default), dream_likes (login-gated,
-- one per user per dream, only on public dreams). Phase 1 only needs
-- profiles + dreams; dream_likes and the is_public-based public-read
-- policy are here now so the schema doesn't need a second migration once
-- Phase 3 (public feed) lands, RLS just won't be exercised for that path yet.

-- profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- dreams
create table if not exists dreams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  mood text not null check (mood in ('happy', 'excited', 'peaceful', 'neutral', 'annoyed', 'sad', 'angry')),
  dream_type text not null check (dream_type in ('normal', 'lucid', 'nightmare', 'recurring')),
  tags text[] not null default '{}',
  people text[] not null default '{}',
  setting text not null default '',
  vividness int not null default 3 check (vividness between 1 and 5),
  date date not null,
  is_public boolean not null default false,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists dreams_user_id_idx on dreams (user_id);
create index if not exists dreams_public_idx on dreams (is_public) where is_public = true;

-- dream_likes
create table if not exists dream_likes (
  id uuid primary key default gen_random_uuid(),
  dream_id uuid not null references dreams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (dream_id, user_id)
);

-- RLS
alter table profiles enable row level security;
alter table dreams enable row level security;
alter table dream_likes enable row level security;

create policy "Profiles are publicly readable"
  on profiles for select
  using (true);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Lets the client self-heal a missing profile row (accounts created before
-- this trigger existed) via upsert, instead of only ever reading "Someone".
create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Two separate SELECT policies (own dreams, public dreams). Postgres
-- combines multiple permissive policies for the same command with OR, so
-- a user sees their own dreams AND everyone's public ones.
create policy "Users can view their own dreams"
  on dreams for select
  using (auth.uid() = user_id);

create policy "Anyone can view public dreams"
  on dreams for select
  using (is_public = true);

create policy "Users can insert their own dreams"
  on dreams for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own dreams"
  on dreams for update
  using (auth.uid() = user_id);

create policy "Users can delete their own dreams"
  on dreams for delete
  using (auth.uid() = user_id);

create policy "Anyone can view likes on public dreams"
  on dream_likes for select
  using (
    user_id = auth.uid()
    or exists (select 1 from dreams where dreams.id = dream_likes.dream_id and dreams.is_public = true)
  );

create policy "Logged in users can like public dreams"
  on dream_likes for insert
  with check (
    auth.uid() = user_id
    and exists (select 1 from dreams where dreams.id = dream_id and dreams.is_public = true)
  );

create policy "Users can remove their own like"
  on dream_likes for delete
  using (auth.uid() = user_id);

-- `create table if not exists` above only affects a table
-- that doesn't exist yet, it's a no-op against your already-created live
-- table, so widening the mood set needs its own migration: find whatever
-- Postgres auto-named the original inline check constraint (rather than
-- guessing "dreams_mood_check" and risking ending up with two constraints
-- ANDed together, the old one still rejecting the new values) via
-- pg_constraint + pg_get_constraintdef, drop it, add the new one.
-- Refer: https://www.postgresql.org/docs/current/catalog-pg-constraint.html
do $$
declare
  cons record;
begin
  for cons in
    select conname from pg_constraint
    where conrelid = 'dreams'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%mood%'
  loop
    execute format('alter table dreams drop constraint %I', cons.conname);
  end loop;
end $$;

alter table dreams add constraint dreams_mood_check
  check (mood in ('happy', 'excited', 'peaceful', 'neutral', 'annoyed', 'sad', 'angry'));

-- Additive column, safe to run against the live table as-is (no existing
-- rows to reconcile the way the mood check constraint needed above). The
-- existing "Users can update their own dreams" policy already covers it,
-- RLS is per-row, not per-column.
alter table dreams add column if not exists is_favorite boolean not null default false;

-- Realtime's postgres_changes doesn't stream every table by
-- default, only ones added to this publication. RLS policies above still
-- gate who receives what; this just turns the tap on for the table.
-- Refer: https://supabase.com/docs/guides/realtime/postgres-changes#adding-tables-to-your-publication
alter publication supabase_realtime add table dreams;
