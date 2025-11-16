import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { formatRUT as fmtRUT, validateRUT, rutLengthValid } from '@/lib/rut';
import { passwordStrength, isPasswordAcceptable } from '@/lib/password';
import PasswordStrengthBar from '@/components/ui/PasswordStrengthBar';

  function formatRUT(value: string) { return fmtRUT(value); }

export default function Login() {
  const { signIn, signUp, user, loading } = useAuth();
  const [mode, setMode] = useState<'login'|'register'|'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [rut, setRut] = useState('');
  const [error, setError] = useState<string | null>(null);
  const pwStrength = passwordStrength(password);
  const passwordOk = isPasswordAcceptable(password);
  const rutOk = !rut || validateRUT(rut);
  const rutLenOk = !rut || rutLengthValid(rut);
  const [message, setMessage] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [usernameTaken, setUsernameTaken] = useState(false);

  useEffect(() => {
    if (mode !== 'register') return;
    let active = true;
    async function check() {
      setChecking(true);
      try {
        const uname = username.toLowerCase();
        if (!uname || uname.length < 3) { setUsernameTaken(false); return; }
        const { data } = await supabase
          .from('users_profile')
          .select('user_id')
          .ilike('username', uname)
          .limit(1);
        if (!active) return;
        setUsernameTaken(!!(data && data.length > 0));
      } finally {
        setChecking(false);
      }
    }
    check();
    return () => { active = false; };
  }, [username, mode]);

  const usernameValid = useMemo(() => /^[a-z0-9_]{3,20}$/i.test(username || ''), [username]);

  // Si el usuario acaba de confirmar email y vuelve, intentar consumir datos pendientes
  useEffect(() => {
    async function applyPending() {
      if (!user) return;
      const pendingRaw = localStorage.getItem('pending_profile');
      if (!pendingRaw) return;
      try {
        const pending = JSON.parse(pendingRaw);
        // Verificar si ya hay username asignado
        const { data: existing } = await supabase
          .from('users_profile')
          .select('username')
          .eq('user_id', user.id)
          .single();
        if (existing?.username) { localStorage.removeItem('pending_profile'); return; }
        if (pending.username && (!pending.rut || validateRUT(pending.rut))) {
          await supabase.from('users_profile').upsert({
            user_id: user.id,
            username: pending.username,
            first_name: pending.first_name || null,
            last_name: pending.last_name || null,
            age: typeof pending.age === 'number' ? pending.age : null,
            rut: pending.rut || null,
            display_name: `${pending.first_name || ''} ${pending.last_name || ''}`.trim() || null
          });
          localStorage.removeItem('pending_profile');
        }
      } catch { /* ignorar */ }
    }
    applyPending();
  }, [user]);

  if (user) return <Navigate to="/profile" replace />;

  return (
    <div className="max-w-md mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">
        {mode === 'login' ? 'Ingresar' : mode === 'register' ? 'Crear cuenta' : 'Restablecer contraseña'}
      </h1>

  {mode === 'forgot' ? (
        <form className="space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          setError(null); setMessage(null);
          try {
    // Enviar enlace mágico que inicia sesión automáticamente
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + '/profile' } });
    if (error) throw error;
    setMessage('Te enviamos un enlace mágico a tu correo. Ábrelo para ingresar automáticamente.');
          } catch (err: any) {
            setError(err?.message ?? 'No se pudo enviar el email');
          }
        }}>
          <input className="w-full border rounded px-3 py-2" type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {message && <div className="text-green-700 text-sm">{message}</div>}
          <button disabled={loading} type="submit" className="w-full bg-blue-600 text-white rounded py-2 disabled:opacity-50">
            {loading ? 'Enviando...' : 'Enviar enlace'}
          </button>
          <button type="button" onClick={()=>setMode('login')} className="w-full text-sm text-slate-600 underline">Volver a ingresar</button>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          setError(null); setMessage(null);
          try {
            if (mode === 'register') {
              if (!usernameValid) throw new Error('Usuario inválido (letras, números, _; largo 3-20).');
              if (rut && !validateRUT(rut)) throw new Error('RUT inválido (debe tener 8 o 9 dígitos antes del DV y DV correcto).');
              if (usernameTaken) throw new Error('El usuario ya está ocupado.');
              await signUp(email, password);
              const session = (await supabase.auth.getSession()).data.session;
              const profilePayload = {
                username: username.toLowerCase(),
                first_name: firstName,
                last_name: lastName,
                age: typeof age === 'number' ? age : null,
                rut: rut,
              };
              if (session?.user) {
                if (rut && !validateRUT(rut)) throw new Error('RUT inválido (debe tener 8 o 9 dígitos antes del DV y DV correcto).');
                await supabase.from('users_profile').upsert({
                  user_id: session.user.id,
                  username: profilePayload.username,
                  first_name: profilePayload.first_name || null,
                  last_name: profilePayload.last_name || null,
                  age: profilePayload.age,
                  rut: profilePayload.rut || null,
                  display_name: `${firstName} ${lastName}`.trim() || null
                });
                setMessage('Cuenta creada e iniciada.');
                setMode('login');
              } else {
                // Persistir para cuando el usuario confirme email y regrese
                localStorage.setItem('pending_profile', JSON.stringify(profilePayload));
                setMessage('Cuenta creada. Revisa tu correo para confirmar y luego se completará tu perfil.');
                setMode('login');
              }
            } else {
              await signIn(email, password);
            }
          } catch (err: any) {
            setError(err?.message ?? 'Error al procesar');
          }
        }}>
          <input className="w-full border rounded px-3 py-2" type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <div>
            <input className="w-full border rounded px-3 py-2" type="password" placeholder="Contraseña" value={password} onChange={(e)=>setPassword(e.target.value)} />
            <PasswordStrengthBar password={password} />
          </div>

          {mode === 'register' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input className="w-full border rounded px-3 py-2" placeholder="Nombre" value={firstName} onChange={(e)=>setFirstName(e.target.value)} />
                <input className="w-full border rounded px-3 py-2" placeholder="Apellido" value={lastName} onChange={(e)=>setLastName(e.target.value)} />
              </div>
              <div>
                <input className={`w-full border rounded px-3 py-2 ${username && (!usernameValid || usernameTaken) ? 'border-red-400' : ''}`} placeholder="Usuario público (único)" value={username} onChange={(e)=>setUsername(e.target.value.toLowerCase())} />
                <div className="text-xs mt-1">
                  <span className={usernameTaken ? 'text-red-600' : 'text-slate-500'}>
                    {usernameTaken ? 'El usuario ya está ocupado' : `Tu URL pública será /u/${username || 'usuario'}`}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input className="w-full border rounded px-3 py-2" type="number" min={0} placeholder="Edad" value={age} onChange={(e)=>setAge(e.target.value === '' ? '' : Number(e.target.value))} />
                <div>
                  <input className={`w-full border rounded px-3 py-2 ${(rut && (!rutOk || !rutLenOk)) ? 'border-red-400' : ''}`} placeholder="RUT (x.xxx.xxx-x)" value={rut} onChange={(e)=>setRut(formatRUT(e.target.value))} />
                  {rut && (!rutLenOk || !rutOk) && <div className="text-xs text-red-600 mt-1">RUT inválido (8-9 dígitos + DV correcto)</div>}
                </div>
              </div>
            </div>
          )}

          {error && <div className="text-red-600 text-sm">{error}</div>}
          {message && <div className="text-green-700 text-sm">{message}</div>}

          <button disabled={loading || (mode==='register' && (!passwordOk || !rutLenOk || !rutOk || usernameTaken || !usernameValid))} type="submit" className="w-full bg-blue-600 text-white rounded py-2 disabled:opacity-50">
            {loading ? (mode === 'register' ? 'Creando...' : 'Ingresando...') : (mode === 'register' ? 'Crear cuenta' : 'Entrar')}
          </button>

          <div className="flex gap-2 text-sm justify-between">
            <button type="button" onClick={()=>setMode(mode==='register'?'login':'register')} className="text-slate-600 underline">
              {mode==='register' ? 'Ya tengo cuenta, ingresar' : 'No tengo cuenta, crear una'}
            </button>
            <button type="button" onClick={()=>setMode('forgot')} className="text-slate-600 underline">Olvidé mi contraseña</button>
          </div>
        </form>
      )}
    </div>
  );
}
