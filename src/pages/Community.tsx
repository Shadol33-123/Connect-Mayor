import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import FriendCard from '@/components/social/FriendCard';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface ProfileLite { user_id: string; username: string | null; display_name: string | null; avatar_url: string | null; total_xp: number; bio: string | null; }
interface FriendRequest { id: string; requester_id: string; receiver_id: string; status: 'pending'|'accepted'|'rejected'; }

function getState(reqs: FriendRequest[], myId: string, otherId: string): 'self'|'none'|'outgoing'|'incoming'|'accepted'|'rejected' {
  if (myId === otherId) return 'self';
  const r = reqs.find(r => (r.requester_id === myId && r.receiver_id === otherId) || (r.receiver_id === myId && r.requester_id === otherId));
  if (!r) return 'none';
  if (r.status === 'accepted') return 'accepted';
  if (r.status === 'pending' && r.requester_id === myId) return 'outgoing';
  if (r.status === 'pending' && r.receiver_id === myId) return 'incoming';
  if (r.status === 'rejected') return 'rejected';
  return 'none';
}

export default function Community() {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const qc = useQueryClient();
  const term = useMemo(() => q.trim().toLowerCase(), [q]);

  const profiles = useQuery<ProfileLite[]>({
    queryKey: ['community-search', term],
    queryFn: async () => {
      if (!term) return [];
      const { data, error } = await supabase
        .from('users_profile')
        .select('user_id, username, display_name, avatar_url, total_xp, bio')
        .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
        .order('total_xp', { ascending: false })
        .limit(40);
      if (error) throw error;
      return (data || []) as ProfileLite[];
    }
  });

  const requests = useQuery<FriendRequest[]>({
    queryKey: ['community-requests'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('friend_requests')
        .select('id, requester_id, receiver_id, status')
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);
      if (error) throw error;
      return (data || []) as FriendRequest[];
    },
    enabled: !!user
  });

  const sendRequest = useMutation({
    mutationFn: async (otherId: string) => {
      if (!user) throw new Error('No auth');
      const { error } = await supabase.from('friend_requests').insert({ requester_id: user.id, receiver_id: otherId, status: 'pending' });
      if (error) throw error;
      await supabase.from('notifications').insert({ title: 'Solicitud de amistad', body: `Has recibido una solicitud de @${user.email?.split('@')[0]}`, user_id: otherId });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['community-requests'] }); }
  });

  const acceptRequest = useMutation({
    mutationFn: async (id: string) => {
      const { data: req, error: fetchErr } = await supabase.from('friend_requests').select('requester_id').eq('id', id).single();
      if (fetchErr) throw fetchErr;
      const { error } = await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', id);
      if (error) throw error;
      if (req) await supabase.from('notifications').insert({ title: 'Amistad aceptada', body: '¡Ahora son amigos!', user_id: req.requester_id });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['community-requests'] }); }
  });

  const rejectRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('friend_requests').update({ status: 'rejected' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['community-requests'] }); }
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Comunidad</h1>
        <p className="text-sm text-slate-600">Explora perfiles y expande tu red profesional. Construye conexiones de valor.</p>
        <div className="relative">
          <input
            value={q}
            onChange={e=>setQ(e.target.value)}
            placeholder="Buscar por usuario (@username) o nombre completo"
            className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
          />
          {profiles.isFetching && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-500">Buscando...</span>}
        </div>
      </div>

      <Card className="rounded-2xl p-6">
        {profiles.isLoading && <Skeleton className="h-24 w-full rounded-xl" />}
        {!profiles.isLoading && (profiles.data?.length || 0) === 0 && term && (
          <div className="text-sm text-slate-500">Sin resultados para “{term}”.</div>
        )}
        <div
          className="grid gap-6"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            alignItems: 'stretch',
            minHeight: '100px',
          }}
        >
          {(profiles.data || []).map(p => {
            const state = getState(requests.data||[], user?.id||'', p.user_id);
            return (
              <FriendCard
                key={p.user_id}
                userId={p.user_id}
                username={p.username}
                displayName={p.display_name}
                avatarUrl={p.avatar_url}
                xp={p.total_xp}
                bio={undefined}
                hideBio
                state={user ? state : 'none'}
                onSend={state === 'none' ? () => sendRequest.mutate(p.user_id) : undefined}
                onAccept={state === 'incoming' ? () => { const r = (requests.data||[]).find(r=>r.requester_id===p.user_id && r.receiver_id===user?.id && r.status==='pending'); if (r) acceptRequest.mutate(r.id); } : undefined}
                onReject={state === 'incoming' ? () => { const r = (requests.data||[]).find(r=>r.requester_id===p.user_id && r.receiver_id===user?.id && r.status==='pending'); if (r) rejectRequest.mutate(r.id); } : undefined}
                link={`/u/${p.username}`}
                // @ts-ignore
                style={{ height: '100%' }}
              />
            );
          })}
        </div>
      </Card>
    </div>
  );
}
