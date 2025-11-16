import { Outlet } from 'react-router-dom';
import Nav from './Nav';
import Footer from '@/components/experience/Footer';
import React from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Button from '@/components/ui/Button';
import { validateRUT, rutLengthValid, formatRUT as fmtRUT } from '@/lib/rut';
import ChatDock from '@/components/social/ChatDock';

function CompleteProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const { data: profile, refetch } = useUserProfile();
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [rut, setRut] = useState('');
  const userValid = /^[a-z0-9_]{3,20}$/i.test(username);
  const rutLenOk = !rut || rutLengthValid(rut);
  const rutOk = !rut || validateRUT(rut);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [usernameTaken, setUsernameTaken] = useState(false);
  if (!open) return null;
  async function save() {
    setError(null); setSaving(true);
    try {
      if (!user) throw new Error('No auth');
      if (!userValid) throw new Error('Usuario inválido');
      if (usernameTaken) throw new Error('Usuario ocupado');
      if (rut && !validateRUT(rut)) throw new Error('RUT inválido (8-9 dígitos + DV)');
      await supabase.from('users_profile').upsert({
        user_id: user.id,
        username: username.toLowerCase(),
        first_name: firstName || null,
        last_name: lastName || null,
        age: typeof age === 'number' ? age : null,
        rut: rut || null,
        display_name: `${firstName} ${lastName}`.trim() || null
      });
      await refetch();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Error al guardar');
    } finally { setSaving(false); }
  }

  // Availability check effect
  React.useEffect(() => {
    let active = true;
    async function run() {
      if (!userValid || !username) { setUsernameTaken(false); return; }
      setChecking(true);
      const { data } = await supabase
        .from('users_profile')
        .select('user_id')
        .ilike('username', username.toLowerCase())
        .limit(1);
      if (active) setUsernameTaken(!!(data && data.length > 0 && data[0].user_id !== user?.id));
      setChecking(false);
    }
    run();
    return () => { active = false; };
  }, [username, userValid, user?.id]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 space-y-4">
        <h2 className="text-xl font-bold">Completa tu perfil</h2>
        <p className="text-sm text-slate-600">Necesitamos algunos datos para tu perfil público.</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <input className={`border rounded px-3 py-2 w-full ${(username && (!userValid || usernameTaken)) ? 'border-red-400' : ''}`} placeholder="Usuario público" value={username} onChange={(e)=>setUsername(e.target.value.toLowerCase())} />
            <div className="text-xs mt-1 flex justify-between">
              <span className={usernameTaken ? 'text-red-600' : 'text-slate-500'}>
                {usernameTaken ? 'El usuario ya está ocupado' : `URL: /u/${username || 'usuario'}`}
              </span>
              {checking && <span className="text-[10px] text-slate-400">Verificando…</span>}
            </div>
          </div>
          <input className="border rounded px-3 py-2" placeholder="Nombre" value={firstName} onChange={(e)=>setFirstName(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Apellido" value={lastName} onChange={(e)=>setLastName(e.target.value)} />
          <input className="border rounded px-3 py-2" type="number" min={0} placeholder="Edad" value={age} onChange={(e)=>setAge(e.target.value===''?'':Number(e.target.value))} />
          <div className="col-span-2 grid gap-1">
            <input className={`border rounded px-3 py-2 ${rut && (!rutLenOk || !rutOk) ? 'border-red-400' : ''}`} placeholder="RUT" value={rut} onChange={(e)=>setRut(fmtRUT(e.target.value))} />
            {rut && (!rutLenOk || !rutOk) && <span className="text-xs text-red-600">RUT inválido (8-9 dígitos + DV)</span>}
          </div>
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Luego</Button>
          <Button disabled={!!(saving || !userValid || usernameTaken || (rut && (!rutLenOk || !rutOk)))} onClick={save}>{saving? 'Guardando...' : 'Guardar'}</Button>
        </div>
        <div className="text-xs text-slate-500">Tu URL será /u/{username || 'usuario'}</div>
      </div>
    </div>
  );
}

export default function Layout() {
  const { data: profile } = useUserProfile();
  const showModal = !!(profile && !profile.username);
  const [open, setOpen] = useState(showModal);
  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="max-w-6xl mx-auto p-4">
        <Outlet />
      </main>
      <Footer />
      <ChatDock />
      <CompleteProfileModal open={!!(open && showModal)} onClose={()=>setOpen(false)} />
    </div>
  );
}
