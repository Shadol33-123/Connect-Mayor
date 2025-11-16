import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { RankBadge } from '@/components/ui/RankBadge';
import Skeleton from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { getProgressToNextRank } from '@/lib/ranks';
import { resolveAvatar } from '@/lib/avatars';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';

interface PublicProfileRow {
  user_id: string;
  username: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  rut: string | null;
  total_xp: number;
  bio: string | null;
  banner_style: string | null;
  avatar_url: string | null;
  website: string | null;
  linkedin: string | null;
  github: string | null;
  portfolio: string | null;
  show_links: boolean;
  show_achievements: boolean;
  show_progress: boolean;
  show_personal: boolean;
}

interface FriendRequestRow { id: string; requester_id: string; receiver_id: string; status: 'pending'|'accepted'|'rejected'; }

function getFriendState(reqs: FriendRequestRow[], myId: string, otherId: string): 'self'|'none'|'outgoing'|'incoming'|'accepted'|'rejected' {
  if (!myId || !otherId) return 'none';
  if (myId === otherId) return 'self';
  const r = reqs.find(r => (r.requester_id === myId && r.receiver_id === otherId) || (r.receiver_id === myId && r.requester_id === otherId));
  if (!r) return 'none';
  if (r.status === 'accepted') return 'accepted';
  if (r.status === 'pending' && r.requester_id === myId) return 'outgoing';
  if (r.status === 'pending' && r.receiver_id === myId) return 'incoming';
  if (r.status === 'rejected') return 'rejected';
  return 'none';
}

export default function PublicProfile() {
  const { username } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery<PublicProfileRow | null>({
    queryKey: ['public-profile', username],
    queryFn: async () => {
      if (!username) return null;
      const { data, error } = await supabase
        .from('users_profile')
  .select('user_id,username,display_name,first_name,last_name,age,rut,total_xp,bio,banner_style,avatar_url,website,linkedin,github,portfolio,show_links,show_achievements,show_progress,show_personal')
        .ilike('username', username)
        .single();
      if (error) throw error;
      return data as PublicProfileRow;
    },
    enabled: !!username,
  });

  const friendsTop = useQuery<{ user_id: string; username: string | null; display_name: string | null; avatar_url: string | null; total_xp: number; }[]>({
    queryKey: ['public-friends-top', data?.user_id],
    queryFn: async () => {
      if (!data?.user_id) return [];
      const { data: rels, error } = await supabase
        .from('friend_requests')
        .select('requester_id, receiver_id, status')
        .or(`requester_id.eq.${data.user_id},receiver_id.eq.${data.user_id}`)
        .eq('status', 'accepted');
      if (error) throw error;
      const otherIds = (rels||[]).map(r => r.requester_id === data.user_id ? r.receiver_id : r.requester_id);
      if (otherIds.length === 0) return [];
      const { data: profs, error: pErr } = await supabase
        .from('users_profile')
        .select('user_id, username, display_name, avatar_url, total_xp')
        .in('user_id', otherIds)
        .order('total_xp', { ascending: false })
        .limit(5);
      if (pErr) throw pErr;
      return profs || [];
    },
    enabled: !!data?.user_id
  });

  const requests = useQuery<FriendRequestRow[]>({
    queryKey: ['public-profile-requests', data?.user_id, user?.id],
    queryFn: async () => {
      if (!user || !data?.user_id) return [];
      const { data: reqs, error: reqErr } = await supabase
        .from('friend_requests')
        .select('id,requester_id,receiver_id,status')
        .or(`and(requester_id.eq.${user.id},receiver_id.eq.${data.user_id}),and(requester_id.eq.${data.user_id},receiver_id.eq.${user.id})`)
        .limit(1);
      if (reqErr) throw reqErr;
      return (reqs || []) as FriendRequestRow[];
    },
    enabled: !!user && !!data?.user_id
  });

  const sendRequest = useMutation({
    mutationFn: async () => {
      if (!user || !data?.user_id) return;
      const { error: insErr } = await supabase
        .from('friend_requests')
        .insert({ requester_id: user.id, receiver_id: data.user_id, status: 'pending' });
      if (insErr) throw insErr;
      try {
        await supabase.from('notifications').insert({ title: 'Solicitud de amistad', body: `Has recibido una solicitud de @${user.email?.split('@')[0]}`, user_id: data.user_id });
      } catch (_) { /* tabla notifications opcional */ }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['public-profile-requests', data?.user_id, user?.id] }); }
  });

  const acceptRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', id);
      if (error) throw error;
      const req = requests.data?.find(r=>r.id===id);
  if (req) { try { await supabase.from('notifications').insert({ title: 'Amistad aceptada', body: '¡Ahora son amigos!', user_id: req.requester_id }); } catch (_) {} }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['public-profile-requests', data?.user_id, user?.id] }); }
  });

  const rejectRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('friend_requests').update({ status: 'rejected' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['public-profile-requests', data?.user_id, user?.id] }); }
  });

  const removeFriend = useMutation({
    mutationFn: async () => {
      if (!user || !data?.user_id) return;
      const fr = (requests.data||[]).find(r => r.status==='accepted');
      if (!fr) return;
      const { error } = await supabase.from('friend_requests').update({ status: 'rejected' }).eq('id', fr.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['public-profile-requests', data?.user_id, user?.id] }); }
  });

  if (isLoading) return <div className="p-6"><Skeleton className="h-32 w-full" /></div>;
  if (error) return <div className="p-6 text-red-600">{(error as any).message}</div>;
  if (!data) return <div className="p-6 text-slate-600">Perfil no encontrado.</div>;

  const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ') || data.display_name || data.username || 'Usuario';
  const relationState = getFriendState(requests.data||[], user?.id||'', data.user_id);
  const rankProgress = getProgressToNextRank(data.total_xp);
  const nextRank = rankProgress.next;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className={`relative bg-gradient-to-r from-indigo-500 to-cyan-500 overflow-hidden full-bleed`}> 
  <div className="max-w-5xl mx-auto px-6 py-12 text-white flex flex-col sm:flex-row gap-6">
          <div className="w-24 h-24 rounded-2xl shadow-xl overflow-hidden grid place-items-center">
            {(() => {
              const r = resolveAvatar(data.avatar_url);
              if (r.type === 'url') return <img src={r.url} alt={fullName} className="w-full h-full object-cover"/>;
              if (r.type === 'preset') return <div className={`w-full h-full ${r.preset.bg} grid place-items-center text-4xl`}>{r.preset.icon}</div>;
              return <div className="w-full h-full grid place-items-center text-3xl font-bold text-slate-700">{(fullName[0] || 'U').toUpperCase()}</div>;
            })()}
          </div>
          <div className="flex-1 flex flex-col gap-3">
            <h1 className="text-3xl font-black leading-tight">{fullName}</h1>
            <p className="text-white/90 text-sm">
              @{data.username} • {rankProgress.current.label}{nextRank && ` • faltan ${rankProgress.remaining} XP para ${nextRank.label}`}
            </p>
            {data.bio && <p className="text-sm text-white/80 max-w-xl">{data.bio}</p>}
            {/* Botón de relación */}
            {user && relationState !== 'self' && (
              <div className="mt-2">
                {relationState === 'none' && <Button onClick={()=>sendRequest.mutate()} disabled={sendRequest.status==='pending'} className="text-xs">Agregar amigo</Button>}
                {relationState === 'outgoing' && <span className="text-xs bg-white/20 px-3 py-1 rounded-full">Solicitud enviada</span>}
                {relationState === 'incoming' && (
                  <div className="flex gap-2 flex-wrap">
                    <Button onClick={()=>{ const r = (requests.data||[]).find(r=>r.status==='pending' && r.requester_id===data.user_id); if (r) acceptRequest.mutate(r.id); }} className="text-xs">Aceptar</Button>
                    <Button variant="ghost" onClick={()=>{ const r = (requests.data||[]).find(r=>r.status==='pending' && r.requester_id===data.user_id); if (r) rejectRequest.mutate(r.id); }} className="text-xs">Rechazar</Button>
                  </div>
                )}
                {relationState === 'accepted' && <Button variant="ghost" onClick={()=>removeFriend.mutate()} disabled={removeFriend.status==='pending'} className="text-xs">Eliminar amigo</Button>}
                {relationState === 'rejected' && <span className="text-xs text-red-200">Rechazado</span>}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {/* Rango y progreso */}
        <Card className="p-6 rounded-2xl">
          <h2 className="text-lg font-semibold mb-4">Rango</h2>
          <RankBadge xp={data.total_xp} />
        </Card>

        {/* Progreso */}
        {data.show_progress ? (
          <Card className="p-6 rounded-2xl">
            <h2 className="text-lg font-semibold mb-4">Progreso</h2>
            <p className="text-sm text-slate-600">XP total: {data.total_xp}</p>
            {nextRank && <p className="text-xs text-slate-500 mt-1">Faltan {rankProgress.remaining} XP para {nextRank.label}</p>}
          </Card>
        ) : (
          <Card className="p-6 rounded-2xl"><p className="text-sm text-slate-500">El usuario ocultó su progreso.</p></Card>
        )}

        {/* Achievements */}
        {data.show_achievements ? (
          <Card className="p-6 rounded-2xl">
            <h2 className="text-lg font-semibold mb-4">Logros</h2>
            <div className="flex flex-wrap gap-3 text-sm text-slate-700">
              <span className="px-3 py-2 rounded-xl bg-slate-100 border">🏁 Primera lección</span>
              <span className="px-3 py-2 rounded-xl bg-slate-100 border">📚 5 lecciones</span>
              <span className="px-3 py-2 rounded-xl bg-slate-100 border">⚡ 100 XP</span>
            </div>
          </Card>
        ) : (
          <Card className="p-6 rounded-2xl"><p className="text-sm text-slate-500">Logros ocultos.</p></Card>
        )}

        {/* Datos personales */}
        {data.show_personal ? (
          <Card className="p-6 rounded-2xl">
            <h2 className="text-lg font-semibold mb-4">Datos</h2>
            <ul className="text-sm text-slate-700 space-y-1">
              {data.age !== null && <li>Edad: {data.age}</li>}
              {data.rut && <li>RUT: {data.rut}</li>}
            </ul>
          </Card>
        ) : (
          <Card className="p-6 rounded-2xl text-sm text-slate-500">Datos personales ocultos.</Card>
        )}

        {/* Amigos destacados */}
        {friendsTop.data && friendsTop.data.length > 0 && (
          <Card className="p-6 rounded-2xl">
            <h2 className="text-lg font-semibold mb-4">Amigos destacados</h2>
            <div className="flex flex-wrap gap-4">
              {friendsTop.data.map(f => (
                <div key={f.user_id} className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden grid place-items-center text-sm font-bold text-slate-700">
                    {(() => { const r = resolveAvatar(f.avatar_url); if (r.type==='url') return <img src={r.url} className="w-full h-full object-cover"/>; if (r.type==='preset') return <div className={`w-full h-full ${r.preset.bg} grid place-items-center text-xl`}>{r.preset.icon}</div>; return (f.display_name?.[0]||'U'); })()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">@{f.username}</span>
                    <span className="text-[11px] text-slate-500">{f.total_xp} XP</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>
      <section className="max-w-5xl mx-auto px-6 pb-12">
        {data.show_links ? (
          <Card className="p-6 rounded-2xl">
            <h2 className="text-lg font-semibold mb-4">Enlaces</h2>
            <ul className="text-sm text-blue-600 space-y-2">
              {data.website && <li><a href={data.website} target="_blank" className="hover:underline" rel="noreferrer">🌐 Sitio web</a></li>}
              {data.linkedin && <li><a href={data.linkedin} target="_blank" className="hover:underline" rel="noreferrer">💼 LinkedIn</a></li>}
              {data.github && <li><a href={data.github} target="_blank" className="hover:underline" rel="noreferrer">🐙 GitHub</a></li>}
              {data.portfolio && <li><a href={data.portfolio} target="_blank" className="hover:underline" rel="noreferrer">🎨 Portfolio</a></li>}
              {!data.website && !data.linkedin && !data.github && !data.portfolio && (
                <li className="text-slate-500">Sin enlaces publicados.</li>
              )}
            </ul>
          </Card>
        ) : (
          <Card className="p-6 rounded-2xl text-sm text-slate-500">Enlaces ocultos.</Card>
        )}
      </section>
    </div>
  );
}
