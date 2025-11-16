-- Enable RLS
alter table public.users_profile enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.units enable row level security;
DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='notifications'
	) THEN
		EXECUTE 'alter table public.notifications enable row level security';
	END IF;
END$$;

-- Policies
-- Public can read minimal profile fields for ranking
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='users_profile' AND policyname='read profiles for ranking'
	) THEN
		CREATE POLICY "read profiles for ranking" ON public.users_profile
		FOR SELECT USING (true);
	END IF;
END$$;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='users_profile' AND policyname='insert own profile'
	) THEN
		CREATE POLICY "insert own profile" ON public.users_profile
		FOR INSERT WITH CHECK (auth.uid() = user_id);
	END IF;
END$$;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='users_profile' AND policyname='update own profile'
	) THEN
		CREATE POLICY "update own profile" ON public.users_profile
		FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
	END IF;
END$$;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='lessons' AND policyname='read lessons'
	) THEN
		CREATE POLICY "read lessons" ON public.lessons
		FOR SELECT USING (true);
	END IF;
END$$;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='units' AND policyname='read units'
	) THEN
		CREATE POLICY "read units" ON public.units
		FOR SELECT USING (true);
	END IF;
END$$;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='lesson_progress' AND policyname='progress read own'
	) THEN
		CREATE POLICY "progress read own" ON public.lesson_progress
		FOR SELECT USING (auth.uid() = user_id);
	END IF;
END$$;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='lesson_progress' AND policyname='progress insert own'
	) THEN
		CREATE POLICY "progress insert own" ON public.lesson_progress
		FOR INSERT WITH CHECK (auth.uid() = user_id);
	END IF;
END$$;

-- Notifications: user can read their own and mark as read
DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='notifications'
	) THEN
		IF NOT EXISTS (
			SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notifications' AND policyname='notifications read own'
		) THEN
			CREATE POLICY "notifications read own" ON public.notifications
			FOR SELECT USING (auth.uid() = user_id);
		END IF;

		IF NOT EXISTS (
			SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notifications' AND policyname='notifications update own'
		) THEN
			CREATE POLICY "notifications update own" ON public.notifications
			FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
		END IF;
	END IF;
END$$;
