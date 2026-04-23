-- aiwebb database schema
-- Kör denna SQL i Supabase SQL Editor: https://app.supabase.com/project/_/sql
--
-- Skapar tabellen `sites` — en rad per kund/sajt.
-- Kopplad till auth.users via user_id med RLS så kunder bara ser sin egen data.

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_published_at timestamptz,

  name text,
  wp_url text,
  wp_api_key text,
  wp_blog_id integer,

  brand jsonb default '{}'::jsonb,
  contact jsonb default '{}'::jsonb,
  seo jsonb default '{}'::jsonb,
  sections jsonb default '[]'::jsonb,

  theme text default 'aiwebb-classic',
  status text default 'draft' check (status in ('draft', 'live', 'paused')),

  constraint sites_user_id_unique unique (user_id)
);

create index sites_user_id_idx on public.sites (user_id);

-- RLS: kunder kan bara läsa/skriva sin egen sajt
alter table public.sites enable row level security;

create policy "Users see their own site"
  on public.sites for select
  using (auth.uid() = user_id);

create policy "Users update their own site"
  on public.sites for update
  using (auth.uid() = user_id);

create policy "Users insert their own site"
  on public.sites for insert
  with check (auth.uid() = user_id);

-- När en ny användare signar upp, skapa en site-rad automatiskt
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.sites (user_id, name)
  values (new.id, 'Min sajt');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-uppdatera updated_at
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger sites_touch_updated_at
  before update on public.sites
  for each row execute function public.touch_updated_at();
