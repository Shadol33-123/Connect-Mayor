-- Migration: Extend users_profile for public professional profile
-- Adds identity, presentation and privacy fields

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

-- Ensure username uniqueness & minimal length constraint via check (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'username_unique'
  ) THEN
    ALTER TABLE public.users_profile
      ADD CONSTRAINT username_unique UNIQUE (username);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'username_length'
  ) THEN
    ALTER TABLE public.users_profile
      ADD CONSTRAINT username_length CHECK (username IS NULL OR length(username) >= 3);
  END IF;
END$$;

-- Optional: index for search (case-insensitive using lower)
create index if not exists users_profile_username_idx on public.users_profile (lower(username));

-- Updated_at trigger
create or replace function public.touch_users_profile()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;$$;

do $$ begin
  create trigger users_profile_touch
    before update on public.users_profile
    for each row execute procedure public.touch_users_profile();
exception when others then null; end $$;

-- Backfill username for existing rows if null (simple generated from left of user_id)
update public.users_profile
  set username = 'user_' || substr(user_id::text,1,8)
  where username is null;

-- Social: friends (solicitudes) y mensajes simples
create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('pending','accepted','rejected')) default 'pending',
  created_at timestamptz default now(),
  unique (requester_id, receiver_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

alter table public.friend_requests enable row level security;
alter table public.messages enable row level security;

-- Policies: un usuario puede ver sus solicitudes y mensajes (enviados o recibidos)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='friend_requests' AND policyname='friend_requests_read'
  ) THEN
    CREATE POLICY "friend_requests_read" ON public.friend_requests FOR SELECT USING (
      auth.uid() = requester_id OR auth.uid() = receiver_id
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='friend_requests' AND policyname='friend_requests_write'
  ) THEN
    CREATE POLICY "friend_requests_write" ON public.friend_requests FOR INSERT WITH CHECK (
      auth.uid() = requester_id AND requester_id <> receiver_id
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='friend_requests' AND policyname='friend_requests_update_receiver'
  ) THEN
    CREATE POLICY "friend_requests_update_receiver" ON public.friend_requests FOR UPDATE USING (
      auth.uid() = receiver_id
    ) WITH CHECK (auth.uid() = receiver_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='messages' AND policyname='messages_read'
  ) THEN
    CREATE POLICY "messages_read" ON public.messages FOR SELECT USING (
      auth.uid() = sender_id OR auth.uid() = receiver_id
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='messages' AND policyname='messages_write'
  ) THEN
    CREATE POLICY "messages_write" ON public.messages FOR INSERT WITH CHECK (
      auth.uid() = sender_id AND sender_id <> receiver_id
    );
  END IF;
END$$;
