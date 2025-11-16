import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Card } from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import Accordion, { AccordionItem } from '@/components/ui/Accordion';
import { useAuth } from '@/hooks/useAuth';

interface ProfileLite { user_id: string; username: string | null; display_name: string | null; total_xp: number; }
interface FriendRequest { id: string; requester_id: string; receiver_id: string; status: 'pending'|'accepted'|'rejected'; }

export default function Friends() {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const queryClient = useQueryClient();
  const debounced = useDebounce(q, 350);

  const profiles = useQuery<ProfileLite[]>({
    queryKey: ['friends-search', debounced],
    queryFn: async () => {
      if (!debounced) return [];
      const { data, error } = await supabase
        .from('users_profile')
        .select('user_id, username, display_name, total_xp')
        .or(`username.ilike.%${debounced}%,display_name.ilike.%${debounced}%`)
        .order('total_xp', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as ProfileLite[];
    }
  });

  const requests = useQuery<FriendRequest[]>({
    queryKey: ['friend-requests'],
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
    mutationFn: async (receiverId: string) => {
      if (!user) throw new Error('No auth');
      const { error } = await supabase.from('friend_requests').insert({ requester_id: user.id, receiver_id: receiverId, status: 'pending' });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['friend-requests'] }); }
  });
  const acceptRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['friend-requests'] }); }
  });
  const rejectRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('friend_requests').update({ status: 'rejected' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['friend-requests'] }); }
  });

  const grouped = useMemo(() => groupByInitial(profiles.data || []), [profiles.data]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Descubre y agrega amigos</h1>
        <span className="text-2xl" aria-hidden>🧭</span>
      </header>

      <Card className="rounded-2xl p-4">
        <div className="flex gap-2 items-center">
          <span aria-hidden>🧭</span>
          <input
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            placeholder="Buscar por usuario o nombre"
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </Card>

      {profiles.isLoading && <Skeleton className="h-20 w-full rounded-xl" />}

      {!profiles.isLoading && (profiles.data?.length ?? 0) > 0 && (
        <Accordion>
          {Object.entries(grouped).map(([initial, list]) => (
            <AccordionItem key={initial} title={<div className="flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-slate-100 grid place-items-center font-bold text-slate-700">{initial}</span><span>Cercanos a “{debounced}”</span></div>}>
              <div className="space-y-2">
                {list.map((p) => {
                  const state = getFriendState(requests.data || [], user?.id || '', p.user_id);
                  return (
                    <Card key={p.user_id} className="p-3 rounded-xl flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-semibold">@{p.username}</span>
                        <span className="text-xs text-slate-500">{p.display_name || '—'} • {p.total_xp} XP</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {state.type === 'self' && <span className="text-xs text-slate-400">Tú</span>}
                        {state.type === 'none' && <Button className="text-sm" onClick={()=>sendRequest.mutate(p.user_id)}>Agregar</Button>}
                        {state.type === 'outgoing' && <span className="text-xs text-slate-500">Solicitud enviada</span>}
                        {state.type === 'incoming' && (
                          <>
                            <Button className="text-sm" onClick={()=>acceptRequest.mutate(state.requestId)}>Aceptar</Button>
                            <Button className="text-sm" variant="ghost" onClick={()=>rejectRequest.mutate(state.requestId)}>Rechazar</Button>
                          </>
                        )}
                        {state.type === 'accepted' && <span className="text-xs text-emerald-600">Amigos</span>}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {!profiles.isLoading && debounced && (profiles.data?.length ?? 0) === 0 && (
        <Card className="p-4 rounded-xl text-sm text-slate-500">Sin resultados.</Card>
      )}
    </div>
  );
}

function useDebounce<T>(value: T, ms: number) {
  const [d, setD] = useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setD(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return d;
}

function groupByInitial(rows: ProfileLite[]) {
  const by: Record<string, ProfileLite[]> = {};
  for (const r of rows) {
    const i = (r.username?.[0] || '•').toUpperCase();
    by[i] = by[i] || [];
    by[i].push(r);
  }
  return by;
}

function getFriendState(reqs: FriendRequest[], myId: string, otherId: string):
  | { type: 'self' }
  | { type: 'none' }
  | { type: 'outgoing' }
  | { type: 'incoming'; requestId: string }
  | { type: 'accepted' } {
  if (myId === otherId) return { type: 'self' };
  const r = reqs.find(r => (r.requester_id === myId && r.receiver_id === otherId) || (r.receiver_id === myId && r.requester_id === otherId));
  if (!r) return { type: 'none' };
  if (r.status === 'accepted') return { type: 'accepted' };
  if (r.requester_id === myId && r.status === 'pending') return { type: 'outgoing' };
  if (r.receiver_id === myId && r.status === 'pending') return { type: 'incoming', requestId: r.id };
  return { type: 'none' };
}
