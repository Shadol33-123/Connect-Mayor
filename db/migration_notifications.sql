-- Notifications table, RLS, policies and indexes (idempotent)
-- Creates a simple notifications table and enables safe access for end users
-- Run this in your Supabase SQL editor; it's safe to run multiple times

-- Ensure pgcrypto exists for gen_random_uuid (usually available in Supabase)
create extension if not exists pgcrypto;

create table if not exists public.notifications (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users(id) on delete cascade,
	title text not null,
	body text,
	read_at timestamptz,
	created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Idempotent policies: read/update own notifications
do $$
begin
	if not exists (
		select 1 from pg_policies where schemaname='public' and tablename='notifications' and policyname='notifications read own'
	) then
		create policy "notifications read own" on public.notifications
			for select using (auth.uid() = user_id);
	end if;

	if not exists (
		select 1 from pg_policies where schemaname='public' and tablename='notifications' and policyname='notifications update own'
	) then
		create policy "notifications update own" on public.notifications
			for update using (auth.uid() = user_id)
			with check (auth.uid() = user_id);
	end if;
end$$;

-- Helpful indexes
-- Ensure read_at column exists (handle legacy schema with boolean read)
do $$
begin
	if not exists (
		select 1 from information_schema.columns where table_schema='public' and table_name='notifications' and column_name='read_at'
	) then
		if exists (
			select 1 from information_schema.columns where table_schema='public' and table_name='notifications' and column_name='read'
		) then
			-- Legacy: add read_at, migrate data from read=true, then drop old column
			alter table public.notifications add column read_at timestamptz;
			execute 'update public.notifications set read_at = created_at where read = true';
			-- Drop legacy boolean column for unified API
			alter table public.notifications drop column read;
		else
			alter table public.notifications add column read_at timestamptz;
		end if;
	end if;
end$$;

create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_user_unread_idx on public.notifications(user_id) where read_at is null;
create index if not exists notifications_created_at_idx on public.notifications(created_at desc);

