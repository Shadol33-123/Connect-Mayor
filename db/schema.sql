-- Supabase schema for CONNECT
-- Auth uses built-in auth schema. We store domain data in public.

-- Extensions
create extension if not exists pgcrypto;

create table if not exists public.users_profile (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  total_xp int not null default 0,
  created_at timestamp with time zone default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  xp int not null default 50,
  order_index int not null default 0,
  created_at timestamp with time zone default now()
);

-- Units (sections) and lesson level
create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  order_index int not null default 0,
  created_at timestamp with time zone default now()
);

do $$ begin
  alter table public.lessons add column if not exists unit_id uuid references public.units(id) on delete set null;
  alter table public.lessons add column if not exists level text check (level in ('basico','medio','experto')) default 'basico';
exception when others then null; end $$;

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamp with time zone not null default now(),
  xp_earned int not null default 0,
  unique(user_id, lesson_id)
);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  read_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Function to update total_xp after insert
create or replace function public.handle_lesson_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  l_title text;
begin
  -- ensure profile exists
  insert into public.users_profile (user_id)
  values (new.user_id)
  on conflict (user_id) do nothing;

  -- accumulate XP
  update public.users_profile
    set total_xp = total_xp + new.xp_earned
    where user_id = new.user_id;

  -- fetch lesson title for notification
  select title into l_title from public.lessons where id = new.lesson_id;

  -- create notification
  insert into public.notifications (user_id, title, body)
  values (
    new.user_id,
    '¡Lección completada!',
    coalesce('Has completado ' || quote_literal(l_title) || ' y ganaste ' || new.xp_earned || ' XP', 'Has completado una lección')
  );

  return new;
end;
$$;

-- Trigger
create trigger on_lesson_completed
  after insert on public.lesson_progress
  for each row execute procedure public.handle_lesson_completed();

-- View for dashboard: progress per unit
create or replace view public.v_unit_progress as
select
  u.id as unit_id,
  u.title as unit_title,
  u.order_index,
  count(l.id) as total_lessons,
  sum(case when lp.id is not null then 1 else 0 end) as completed_lessons,
  coalesce(sum(lp.xp_earned),0) as xp_earned
from public.units u
left join public.lessons l on l.unit_id = u.id
left join public.lesson_progress lp on lp.lesson_id = l.id
group by u.id, u.title, u.order_index
order by u.order_index;
