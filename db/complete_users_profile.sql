-- Full consolidated definition for users_profile table
-- Run this in Supabase SQL editor. It is idempotent (uses IF NOT EXISTS or conditional adds).

-- 1. Ensure base table exists
create table if not exists public.users_profile (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  total_xp int not null default 0,
  created_at timestamptz default now()
);

-- 2. Add extended columns (profile + privacy + links)
alter table public.users_profile
  add column if not exists username text,
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists age int check (age >= 0),
  add column if not exists rut text,
  add column if not exists bio text,
  add column if not exists banner_style text,
  add column if not exists avatar_url text,
  add column if not exists website text,
  add column if not exists linkedin text,
  add column if not exists github text,
  add column if not exists portfolio text,
  add column if not exists show_links boolean not null default true,
  add column if not exists show_achievements boolean not null default true,
  add column if not exists show_progress boolean not null default true,
  add column if not exists show_personal boolean not null default false,
  add column if not exists updated_at timestamptz default now();

-- 3. Constraints (unique + length)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'username_unique'
  ) THEN
    ALTER TABLE public.users_profile ADD CONSTRAINT username_unique UNIQUE (username);
  END IF;
END $$;

-- Postgres doesn't support IF NOT EXISTS for check constraints directly; wrap in DO block
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'username_length'
  ) THEN
    ALTER TABLE public.users_profile ADD CONSTRAINT username_length CHECK (username IS NULL OR length(username) >= 3);
  END IF;
END $$;

-- RUT length constraint: body 7 or 8 digits plus a DV (numeric or K)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rut_length_check'
  ) THEN
    ALTER TABLE public.users_profile ADD CONSTRAINT rut_length_check CHECK (
      rut IS NULL OR (
        length(regexp_replace(upper(rut), '[^0-9K]', '', 'g')) >= 8 AND
        length(regexp_replace(upper(rut), '[^0-9K]', '', 'g')) <= 9
      )
    );
  END IF;
END $$;

-- 4. Index for search
create index if not exists users_profile_username_idx on public.users_profile (lower(username));

-- 5. Touch trigger for updated_at
create or replace function public.touch_users_profile()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'users_profile_touch'
  ) THEN
    CREATE TRIGGER users_profile_touch
      BEFORE UPDATE ON public.users_profile
      FOR EACH ROW EXECUTE PROCEDURE public.touch_users_profile();
  END IF;
END $$;

-- 6. Backfill username minimal (only if null)
update public.users_profile
  set username = 'user_' || substr(user_id::text,1,8)
  where username is null;

-- 7. (Optional) Basic RLS policies if not already present
alter table public.users_profile enable row level security;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='users_profile' AND policyname = 'read profiles for ranking'
  ) THEN
    CREATE POLICY "read profiles for ranking" ON public.users_profile FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='users_profile' AND policyname = 'insert own profile'
  ) THEN
    CREATE POLICY "insert own profile" ON public.users_profile FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='users_profile' AND policyname = 'update own profile'
  ) THEN
    CREATE POLICY "update own profile" ON public.users_profile FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Done.
