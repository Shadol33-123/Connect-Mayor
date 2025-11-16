# CONNECT (Vite + React + Tailwind + Supabase)

Plataforma base para probar la base de datos y el flujo de progreso con Supabase.

## Setup rápido

1. Copia `.env.example` a `.env` y rellena `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
    - Ejemplo:
       - VITE_SUPABASE_URL=https://tnijgkiyhvoybcamljhk.supabase.co
       - VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
2. En Supabase Studio:
   - Ejecuta `db/schema.sql` y `db/policies.sql` en el editor SQL.
   - (Opcional) Ejecuta `db/seed.sql` para crear lecciones de ejemplo.
   - Crea algunas lecciones en `public.lessons`.
3. Instala dependencias y arranca el dev server.

## Scripts

- `npm run dev` – desarrollo
- `npm run build` – build de producción
- `npm run preview` – vista previa

## Estructura

- `src/lib/supabaseClient.ts` – cliente Supabase
- `src/lib/progress.ts` – llamadas para progreso y XP
- `src/hooks/useAuth.tsx` – contexto de autenticación
- `src/pages/*` – páginas básicas

## Notas

- Políticas RLS permiten: leer lecciones, leer/insertar progreso propio, leer/crear perfil propio.
- Trigger suma XP al perfil al completar lección.

Seguridad
- Nunca publiques ni subas a repositorios tu clave anon real en README o issues. Usa `.env` local.
