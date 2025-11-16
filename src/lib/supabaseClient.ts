import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Faltan variables de entorno de Supabase. Revisa .env');
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    persistSession: true,
    storageKey: 'connect-auth',
  },
});
