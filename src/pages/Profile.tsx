import { useUserProfile } from '@/hooks/useUserProfile';
import { RankBadge } from '@/components/ui/RankBadge';
import { Card } from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import ProfileEditor from '@/components/ProfileEditor';
import Button from '@/components/ui/Button';
import { resolveAvatar } from '@/lib/avatars';
import { BANNER_STYLES } from '@/components/ProfileEditor';
import { Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { getProgressToNextRank } from '@/lib/ranks';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import React from 'react';
import FriendCard from '@/components/social/FriendCard';

function useDebounce<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  React.useEffect(() => { const t = setTimeout(()=>setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

export default function Profile() {
  const { user } = useAuth();
  const profileQuery = useUserProfile();
  const queryClient = useQueryClient();
  const [publicPreview, setPublicPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');
  const [friendsPage, setFriendsPage] = useState(1);
  const [friendsOrder, setFriendsOrder] = useState<'xp'|'name'>('xp');
  const debouncedFriendSearch = useDebounce(friendSearch, 350);
  const pageSize = 20;

  const p = profileQuery.data;
  const displayName = p?.display_name || user?.email?.split('@')[0] || 'Usuario';
  const bannerStyleId = p?.banner_style || 'ocean';
  const bannerStyle = BANNER_STYLES.find(s => s.id === bannerStyleId) || BANNER_STYLES[0];
  const showProgress = publicPreview ? !!p?.show_progress : true;
  const showAchievements = publicPreview ? !!p?.show_achievements : true;
  const showPersonal = publicPreview ? !!p?.show_personal : true;
  const progress = useMemo(()=>getProgressToNextRank(p?.total_xp || 0), [p?.total_xp]);

  // Amigos aceptados
  const friendsAccepted = useQuery({
    queryKey: ['friends-accepted'],
    queryFn: async () => {
      if (!user) return [] as any[];
      // buscar relaciones accepted donde user es requester o receiver
      const { data, error } = await supabase
        .from('friend_requests')
        .select('requester_id, receiver_id, status')
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq('status', 'accepted');
      if (error) throw error;
      const otherIds = (data || []).map(r => r.requester_id === user.id ? r.receiver_id : r.requester_id);
      if (otherIds.length === 0) return [];
      const { data: profiles, error: pErr } = await supabase
        .from('users_profile')
        .select('user_id, username, display_name, avatar_url, total_xp')
        .in('user_id', otherIds);
      if (pErr) throw pErr;
      return profiles || [];
    },
    staleTime: 30000
  });

  // Búsqueda de usuario para agregar (coincidencia exacta por username)
  const friendSearchResult = useQuery({
    queryKey: ['friend-search', debouncedFriendSearch],
    queryFn: async () => {
      const q = debouncedFriendSearch.trim().toLowerCase();
      if (!q) return null;
      const { data, error } = await supabase
        .from('users_profile')
        .select('user_id, username, display_name, avatar_url, total_xp, bio')
        .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
        .order('total_xp', { ascending: false })
        .limit(1);
      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    },
    enabled: !!debouncedFriendSearch
  });

  // solicitudes del usuario para estado
  const myRequests = useQuery({
    queryKey: ['friend-requests-mini'],
    queryFn: async () => {
      if (!user) return [] as any[];
      const { data, error } = await supabase
        .from('friend_requests')
        .select('id, requester_id, receiver_id, status')
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 15000
  });

  function getState(otherId: string) {
    const reqs: any[] = myRequests.data || [];
    const r = reqs.find(r => (r.requester_id === user?.id && r.receiver_id === otherId) || (r.receiver_id === user?.id && r.requester_id === otherId));
    if (!r) return 'none';
    if (r.status === 'accepted') return 'accepted';
    if (r.status === 'pending' && r.requester_id === user?.id) return 'outgoing';
    if (r.status === 'pending' && r.receiver_id === user?.id) return 'incoming';
    if (r.status === 'rejected') return 'rejected';
    return 'none';
  }

  const sendRequest = useMutation({
    mutationFn: async (otherId: string) => {
      if (!user) throw new Error('No auth');
      const { error } = await supabase.from('friend_requests').insert({ requester_id: user.id, receiver_id: otherId, status: 'pending' });
      if (error) throw error;
      // notificación para el receptor
      const { error: nErr } = await supabase.from('notifications').insert({ title: 'Solicitud de amistad', body: `Has recibido una solicitud de @${p?.username || 'usuario'}` , user_id: otherId });
      if (nErr) console.warn('Notif error', nErr.message);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['friend-requests-mini'] }); }
  });

  const acceptRequest = useMutation({
    mutationFn: async (id: string) => {
      const { data: req, error: fetchErr } = await supabase
        .from('friend_requests')
        .select('requester_id, receiver_id')
        .eq('id', id)
        .single();
      if (fetchErr) throw fetchErr;
      const { error } = await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', id);
      if (error) throw error;
      if (req) {
        await supabase.from('notifications').insert({ title: 'Amistad aceptada', body: `@${p?.username || 'usuario'} aceptó tu solicitud`, user_id: req.requester_id });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friend-requests-mini'] })
  });

  const rejectRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('friend_requests').update({ status: 'rejected' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friend-requests-mini'] })
  });

  const removeFriend = useMutation({
    mutationFn: async (otherId: string) => {
      if (!user) throw new Error('No auth');
      const { data: reqs, error } = await supabase
        .from('friend_requests')
        .select('id, requester_id, receiver_id, status')
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq('status', 'accepted');
      if (error) throw error;
      const rel = (reqs||[]).find(r => (r.requester_id === user.id && r.receiver_id === otherId) || (r.receiver_id === user.id && r.requester_id === otherId));
      if (!rel) throw new Error('Relación no encontrada');
      const { error: updErr } = await supabase.from('friend_requests').update({ status: 'rejected' }).eq('id', rel.id);
      if (updErr) throw updErr;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friend-requests-mini'] })
  });

  const incomingPending = useMemo(() => (myRequests.data||[]).filter(r => r.receiver_id === user?.id && r.status === 'pending'), [myRequests.data, user?.id]);
  const orderedFriends = useMemo(() => {
    const list = (friendsAccepted.data||[]).slice();
    if (friendsOrder === 'xp') return list.sort((a,b)=> (b.total_xp||0)-(a.total_xp||0));
    return list.sort((a,b)=> (a.display_name||'').localeCompare(b.display_name||''));
  }, [friendsAccepted.data, friendsOrder]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Cabecera tipo perfil público (profesional) */}
      <header className={`relative bg-gradient-to-r ${bannerStyle.gradient} ${bannerStyle.texture} overflow-hidden full-bleed`}>
        <div className="max-w-6xl mx-auto px-6 py-10 md:py-14 text-white">
          {profileQuery.isLoading ? (
            <div className="flex gap-4 items-end">
              <Skeleton className="w-24 h-24 rounded-2xl" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-5 w-1/2" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-end gap-5">
              <div className="w-24 h-24 rounded-2xl shadow-xl overflow-hidden grid place-items-center bg-white">
                {(() => {
                  const r = resolveAvatar(p?.avatar_url || null);
                  if (r.type === 'url') return <img src={r.url} alt={displayName} className="w-full h-full object-cover"/>;
                  if (r.type === 'preset') return <div className={`w-full h-full ${r.preset.bg} grid place-items-center text-3xl`}>{r.preset.icon}</div>;
                  return <div className="w-full h-full grid place-items-center text-3xl font-bold text-slate-700">{(displayName[0] || 'U').toUpperCase()}</div>;
                })()}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-black leading-tight">{displayName}</h1>
                <p className="text-white/90 text-sm md:text-base flex items-center gap-2">
                  @{p?.username || 'usuario'}
                </p>
                {/* Botones para cambiar banner y avatar */}
                <div className="flex gap-3 mt-4">
                  <ProfileEditor>
                    <Button className="bg-white text-slate-800 hover:bg-blue-50 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
                      <span aria-hidden>🖼️</span>
                      <span>Cambiar banner</span>
                    </Button>
                  </ProfileEditor>
                  <ProfileEditor>
                    <Button className="bg-white text-slate-800 hover:bg-blue-50 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
                      <span aria-hidden>👤</span>
                      <span>Cambiar avatar</span>
                    </Button>
                  </ProfileEditor>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 sm:ml-auto">
                <ProfileEditor>
                  <Button className="bg-white text-slate-800 hover:bg-blue-50 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
                    <span aria-hidden>✏️</span>
                    <span>Editar perfil</span>
                  </Button>
                </ProfileEditor>
                {p?.username && (
                  <Link to={`/u/${p.username}`}>
                    <Button variant="ghost" className="bg-white/10 text-white border border-white/30 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
                      <span aria-hidden>🌐</span>
                      <span>Ver público</span>
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Rango y estado */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="rounded-2xl p-5 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">Rango</div>
              <div className="mt-2"><RankBadge xp={p?.total_xp || 0} /></div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">XP total</div>
              <div className="text-lg font-bold">{p?.total_xp || 0}</div>
            </div>
          </Card>
          <Card className="rounded-2xl p-5">
            <div className="text-xs text-slate-500 mb-1">Privacidad</div>
            <ul className="text-sm text-slate-700 space-y-1">
              <li>Progreso: {p?.show_progress ? 'Visible' : 'Oculto'}</li>
              <li>Logros: {p?.show_achievements ? 'Visible' : 'Oculto'}</li>
              <li>Datos personales: {p?.show_personal ? 'Visible' : 'Oculto'}</li>
            </ul>
          </Card>
          <Card className="rounded-2xl p-5 flex items-center justify-center text-slate-600 text-sm">
            Consejo: Mantén tu perfil profesional y claro. Añade una bio breve y elige un banner acorde.
          </Card>
        </div>

        {/* Sobre mí */}
  <Card className="rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-2">Presentación</h2>
          <p className="text-sm text-slate-700">{p?.bio || 'Aún no has escrito tu presentación. Usa “Editar perfil” para completarla.'}</p>
        </Card>

        {/* Herramientas rápidas */}
        <section className="grid md:grid-cols-3 gap-4">
          <ToolCard
            icon="🖼️"
              title="Cambiar banner"
              description="Elige uno de los 6 estilos predefinidos desde el editor."
            action={
              <ProfileEditor>
                <Button className="mt-3 text-sm">Abrir editor</Button>
              </ProfileEditor>
            }
          />
          <ToolCard
            icon="👤"
              title="Cambiar avatar"
              description="Selecciona uno de los 6 avatares iniciales o sube una URL."
            action={
              <ProfileEditor>
                <Button className="mt-3 text-sm">Abrir editor</Button>
              </ProfileEditor>
            }
          />
          <ToolCard
            icon="🔒"
            title="Privacidad"
            description="Controla qué ven otros: progreso, logros y datos personales."
            action={
              <div className="flex flex-col gap-2">
                <Link to="/settings"><Button className="mt-3 text-sm" variant="ghost">Abrir configuración</Button></Link>
                <ProfileEditor>
                  <Button className="mt-3 text-sm" variant="secondary">Cambiar banner</Button>
                </ProfileEditor>
                <ProfileEditor>
                  <Button className="mt-3 text-sm" variant="secondary">Cambiar avatar</Button>
                </ProfileEditor>
              </div>
            }
          />
        </section>

        {/* Enlaces profesionales */}
        <Card className="rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-3">Tu perfil público</h2>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {p?.username ? (
              <>
                <Link to={`/u/${p.username}`}>
                  <Button variant="ghost" className="px-4 py-2 rounded-full border border-slate-200 hover:bg-slate-50">
                    <span aria-hidden>🌐</span>
                    <span className="ml-2 font-semibold">Ver público</span>
                  </Button>
                </Link>
                <a className="text-blue-600 hover:underline" href={`/u/${p.username}`}>/u/{p.username}</a>
                <button
                  className="text-xs text-slate-500 hover:text-slate-700"
                  onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/u/${p.username}`); setCopied(true); setTimeout(()=>setCopied(false), 1500); }}
                >
                  {copied ? '¡Copiado!' : 'Copiar enlace'}
                </button>
                {('share' in navigator) && (
                  <button
                    className="text-xs text-slate-500 hover:text-slate-700"
                    onClick={() => (navigator as any).share?.({ title: displayName, url: `${window.location.origin}/u/${p.username}` })}
                  >Compartir</button>
                )}
              </>
            ) : (
              <span className="text-slate-500">Aún no tienes un nombre de usuario. Ve a Configuración para definirlo.</span>
            )}
          </div>
        </Card>

        {/* Progreso, logros y datos personales (respetan privacidad en vista pública) */}
  <div className="grid md:grid-cols-3 gap-4">
          <Card className="rounded-2xl p-6">
            <h3 className="text-base font-semibold mb-2">Progreso</h3>
            {showProgress ? (
              <div className="text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <span>Total XP</span>
                  <span className="font-semibold">{p?.total_xp || 0}</span>
                </div>
                {progress.next && <div className="text-[11px] text-slate-500 mt-1">Faltan {progress.remaining} XP para {progress.next.label}</div>}
              </div>
            ) : (
              <div className="text-sm text-slate-500">Progreso oculto (según tu configuración).</div>
            )}
          </Card>
          <Card className="rounded-2xl p-6">
            <h3 className="text-base font-semibold mb-2">Logros</h3>
            {showAchievements ? (
              <div className="flex flex-wrap gap-3 text-sm text-slate-700">
                <span className="px-3 py-2 rounded-xl bg-slate-50 border">🏁 Primera lección</span>
                <span className="px-3 py-2 rounded-xl bg-slate-50 border">📚 5 lecciones</span>
                <span className="px-3 py-2 rounded-xl bg-slate-50 border">⚡ 100 XP</span>
              </div>
            ) : (
              <div className="text-sm text-slate-500">Logros ocultos (según tu configuración).</div>
            )}
          </Card>
          <Card className="rounded-2xl p-6">
            <h3 className="text-base font-semibold mb-2">Datos personales</h3>
            {showPersonal ? (
              <ul className="text-sm text-slate-700 space-y-1">
                {p?.age !== null && p?.age !== undefined && <li>Edad: {p.age}</li>}
                {p?.rut && <li>RUT: {p.rut}</li>}
                {!p?.age && !p?.rut && <li className="text-slate-500">Sin datos ingresados.</li>}
              </ul>
            ) : (
              <div className="text-sm text-slate-500">Datos personales ocultos (según tu configuración).</div>
            )}
          </Card>
        </div>

        {/* Enlaces profesionales (respetan privacidad en vista pública) */}
        <Card className="rounded-2xl p-6">
          <h3 className="text-base font-semibold mb-2">Enlaces</h3>
          {(publicPreview ? p?.show_links : true) ? (
            <ul className="text-sm text-blue-600 space-y-2">
              {p?.website && <li><a href={p.website} target="_blank" className="hover:underline" rel="noreferrer">🌐 Sitio web</a></li>}
              {p?.linkedin && <li><a href={p.linkedin} target="_blank" className="hover:underline" rel="noreferrer">💼 LinkedIn</a></li>}
              {p?.github && <li><a href={p.github} target="_blank" className="hover:underline" rel="noreferrer">🐙 GitHub</a></li>}
              {p?.portfolio && <li><a href={p.portfolio} target="_blank" className="hover:underline" rel="noreferrer">🎨 Portfolio</a></li>}
              {!p?.website && !p?.linkedin && !p?.github && !p?.portfolio && (
                <li className="text-slate-500">Aún no agregas enlaces.</li>
              )}
            </ul>
          ) : (
            <div className="text-sm text-slate-500">Enlaces ocultos (según tu configuración).</div>
          )}
        </Card>

        {/* Sección de amigos estilo red social */}
      <Card className="rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-semibold">Amigos</h2>
          <div className="flex items-center gap-2">
            <input
              value={friendSearch}
              onChange={e=>setFriendSearch(e.target.value)}
              placeholder="Buscar usuario (@username)"
              className="px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {friendSearchResult.isFetching && <span className="text-xs text-slate-500">Buscando...</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span>Ordenar amigos:</span>
          <select value={friendsOrder} onChange={e=>setFriendsOrder(e.target.value as any)} className="border rounded px-2 py-1">
            <option value="xp">Por XP</option>
            <option value="name">Por nombre</option>
          </select>
        </div>
        {/* Grid de amigos */}
        {friendsAccepted.isLoading ? (
          <Skeleton className="h-24 w-full rounded-xl" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {orderedFriends.slice(0, friendsPage * pageSize).map(f => (
              <FriendCard
                key={f.user_id}
                userId={f.user_id}
                username={f.username}
                displayName={f.display_name}
                avatarUrl={f.avatar_url}
                xp={f.total_xp}
                state={'accepted'}
                compact
                onRemove={() => removeFriend.mutate(f.user_id)}
                link={`/u/${f.username}`}
              />
            ))}
            {(orderedFriends.length === 0) && (
              <div className="col-span-full text-sm text-slate-500">Aún no tienes amigos aceptados.</div>
            )}
          </div>
        )}

        {/* Resultado de búsqueda */}
        {friendSearchResult.data && (
          <FriendCard
            userId={friendSearchResult.data.user_id}
            username={friendSearchResult.data.username}
            displayName={friendSearchResult.data.display_name}
            avatarUrl={friendSearchResult.data.avatar_url}
            xp={friendSearchResult.data.total_xp}
            bio={friendSearchResult.data.bio}
            state={(() => { const s = getState(friendSearchResult.data!.user_id); return user && user.id === friendSearchResult.data!.user_id ? 'self' : s; })()}
            onSend={() => { if (friendSearchResult.data) sendRequest.mutate(friendSearchResult.data.user_id); }}
            onAccept={() => { if (!friendSearchResult.data) return; const req = (myRequests.data||[]).find(r => r.requester_id === friendSearchResult.data!.user_id && r.receiver_id === user?.id); if (req) acceptRequest.mutate(req.id); }}
            onReject={() => { if (!friendSearchResult.data) return; const req = (myRequests.data||[]).find(r => r.requester_id === friendSearchResult.data!.user_id && r.receiver_id === user?.id); if (req) rejectRequest.mutate(req.id); }}
            link={`/u/${friendSearchResult.data.username}`}
          />
        )}
        {(friendsAccepted.data || []).length > pageSize && (
          <div className="mt-4 flex justify-center">
            <Button variant="ghost" className="text-xs" onClick={()=>setFriendsPage(p=>p+1)}>Ver más</Button>
          </div>
        )}
      </Card>

      {/* Solicitudes entrantes */}
      {incomingPending.length > 0 && (
        <Card className="rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold">Solicitudes entrantes</h3>
          <div className="space-y-2">
            {incomingPending.map(r => {
              const otherId = r.requester_id;
              const prof = (friendsAccepted.data||[]).find(f=>f.user_id===otherId); // puede ser null si aún no aceptado
              return (
                <div key={r.id} className="flex items-center justify-between border rounded-lg p-3 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 grid place-items-center text-sm font-bold text-slate-700">{prof?.display_name?.[0] || 'U'}</div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">@{prof?.username || 'usuario'}</span>
                      <span className="text-xs text-slate-500">{prof?.display_name || '—'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button className="text-xs" onClick={()=>acceptRequest.mutate(r.id)}>Aceptar</Button>
                    <Button variant="ghost" className="text-xs" onClick={()=>rejectRequest.mutate(r.id)}>Rechazar</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
      </main>
    </div>
  );
}

function ToolCard({ icon, title, description, action }: { icon: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <Card className="rounded-2xl p-5">
      <div className="text-2xl" aria-hidden>{icon}</div>
      <div className="font-semibold mt-2">{title}</div>
  <div className="text-sm text-slate-600 mt-1">{description}</div>
  {action}
    </Card>
  );
}

// NOTE: Paginación futura: usar range() de PostgREST en friend_requests y perfiles para traer páginas incrementales y evitar traer todos.
