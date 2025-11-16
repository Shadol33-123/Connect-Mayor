import { useEffect, useState, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
  if (session?.user) {
        // Intentar aplicar pending_profile si existe y perfil aún no tiene username
        (async () => {
          try {
            const raw = localStorage.getItem('pending_profile');
            if (!raw) return;
            const pending = JSON.parse(raw);
            const { data: existing } = await supabase
              .from('users_profile')
              .select('username')
              .eq('user_id', session.user.id)
              .single();
            if (existing?.username) { localStorage.removeItem('pending_profile'); return; }
            if (pending.username && (!pending.rut || pending.rut === '' || true)) {
      console.debug('[Auth] Aplicando perfil pendiente');
              await supabase.from('users_profile').upsert({
                user_id: session.user.id,
                username: pending.username,
                first_name: pending.first_name || null,
                last_name: pending.last_name || null,
                age: typeof pending.age === 'number' ? pending.age : null,
                rut: pending.rut || null,
                display_name: `${pending.first_name || ''} ${pending.last_name || ''}`.trim() || null
              });
              localStorage.removeItem('pending_profile');
            }
          } catch {/* ignorar */}
        })();
      }
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
  const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) throw error;
  // Si se requiere confirmación por email, puede no haber sesión aún.
  // No lanzamos error: la UI mostrará un mensaje al usuario.
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
