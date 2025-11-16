-- Migración para mejorar estructura de amistad
-- Ejecutar en Supabase después de tener friend_requests creada.

-- 1. Constraint de unicidad (si aún no existe) para evitar duplicados exactos
DO $$
BEGIN
   IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'friend_requests_unique_pair'
   ) THEN
      ALTER TABLE public.friend_requests
         ADD CONSTRAINT friend_requests_unique_pair UNIQUE (requester_id, receiver_id);
   END IF;
END$$;

-- 2. Evitar auto-amistad
DO $$
BEGIN
   IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'friend_requests_no_self'
   ) THEN
      ALTER TABLE public.friend_requests
         ADD CONSTRAINT friend_requests_no_self CHECK (requester_id <> receiver_id);
   END IF;
END$$;

-- 3. Índices recomendados
CREATE INDEX IF NOT EXISTS idx_friend_requests_requester ON friend_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_pair ON friend_requests(requester_id, receiver_id);

-- 4. Vista de amistades aceptadas (bidireccionalidad lógica)
CREATE OR REPLACE VIEW friendships AS
SELECT requester_id AS user_a, receiver_id AS user_b, created_at
FROM friend_requests
WHERE status = 'accepted';

-- 5. Vista expandida con usernames / display names para consultas rápidas
CREATE OR REPLACE VIEW friendships_expanded AS
SELECT f.user_a, f.user_b,
       p1.username AS user_a_username, p1.display_name AS user_a_display_name, p1.avatar_url AS user_a_avatar,
       p2.username AS user_b_username, p2.display_name AS user_b_display_name, p2.avatar_url AS user_b_avatar,
       f.created_at
FROM friendships f
JOIN users_profile p1 ON p1.user_id = f.user_a
JOIN users_profile p2 ON p2.user_id = f.user_b;

-- 6. Función para estado entre dos usuarios
CREATE OR REPLACE FUNCTION friendship_status(a uuid, b uuid)
RETURNS text AS $$
SELECT status FROM friend_requests
WHERE (requester_id = a AND receiver_id = b)
   OR (requester_id = b AND receiver_id = a)
ORDER BY created_at DESC
LIMIT 1;
$$ LANGUAGE sql STABLE;

-- 7. (Opcional futuro) Añadir estado 'removed' si se requiere distinción
-- ALTER TYPE friendship_status_enum ADD VALUE IF NOT EXISTS 'removed'; -- Sólo si usas enum
-- Luego actualizar lógica en frontend.
