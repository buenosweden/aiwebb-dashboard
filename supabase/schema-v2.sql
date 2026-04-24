-- aiwebb schema v2 — multi-site, subdomäner, user profiles
-- Kör i Supabase SQL Editor

-- User profiles (hämtas från signup-formuläret)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  full_name text,
  company_name text,
  email text
);

alter table public.profiles enable row level security;

create policy "Users see own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Ta bort UNIQUE constraint på sites.user_id (för multi-site)
alter table public.sites drop constraint if exists sites_user_id_unique;

-- Lägg till subdomän-kolumn om den saknas
alter table public.sites add column if not exists subdomain text;
alter table public.sites add column if not exists is_active boolean default true;

-- Unikt subdomän-constraint
create unique index if not exists sites_subdomain_unique on public.sites(subdomain) where subdomain is not null;

-- Uppdatera RLS för multi-site
drop policy if exists "Users see their own site" on public.sites;
drop policy if exists "Users update their own site" on public.sites;
drop policy if exists "Users insert their own site" on public.sites;

create policy "Users see their own sites" on public.sites for select using (auth.uid() = user_id);
create policy "Users update their own sites" on public.sites for update using (auth.uid() = user_id);
create policy "Users insert their own sites" on public.sites for insert with check (auth.uid() = user_id);
create policy "Users delete their own sites" on public.sites for delete using (auth.uid() = user_id);

-- Uppdatera trigger för ny användare — skapar profil men INTE site automatiskt
-- (site skapas under onboarding istället)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

-- Funktion för att generera unik subdomän från företagsnamn
create or replace function public.generate_subdomain(company text)
returns text language plpgsql as $$
declare
  base text;
  candidate text;
  counter int := 0;
begin
  base := lower(regexp_replace(company, '[^a-zA-Z0-9]', '-', 'g'));
  base := regexp_replace(base, '-+', '-', 'g');
  base := trim(both '-' from base);
  base := left(base, 30);
  candidate := base;
  
  while exists (select 1 from public.sites where subdomain = candidate) loop
    counter := counter + 1;
    candidate := base || '-' || counter;
  end loop;
  
  return candidate;
end;
$$;
