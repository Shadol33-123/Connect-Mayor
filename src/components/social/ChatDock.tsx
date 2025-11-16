import React, { useState, useEffect, useRef } from 'react';
import { useAcceptedFriends } from '@/hooks/useAcceptedFriends';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import Button from '@/components/ui/Button';

interface MessageRow { id: string; sender_id: string; receiver_id: string; body: string; created_at: string; }
const PAGE_SIZE = 50;

function useConversation(otherId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  useEffect(() => {
    let active = true;
    async function load() {
      if (!user || !otherId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('id,sender_id,receiver_id,body,created_at')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);
      if (!active) return;
      if (!error && data) {
        const rows = (data as MessageRow[]).slice().reverse();
        setMessages(rows);
        setHasMore((data as MessageRow[]).length === PAGE_SIZE);
      }
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [user, otherId]);

  useEffect(() => {
    if (!user || !otherId) return;
    const channel = supabase.channel(`conv-${user.id}-${otherId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const m = payload.new as MessageRow;
        if ((m.sender_id === user.id && m.receiver_id === otherId) || (m.receiver_id === user.id && m.sender_id === otherId)) {
          setMessages(prev => [...prev, m]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, otherId]);

  async function send(body: string) {
    if (!user || !otherId || !body.trim()) return;
    const text = body.trim();
    // Optimistic local append
    const temp: MessageRow = { id: crypto.randomUUID(), sender_id: user.id, receiver_id: otherId, body: text, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, temp]);
    const { error } = await supabase.from('messages').insert({ sender_id: user.id, receiver_id: otherId, body: text });
    if (error) console.error(error.message);
  }

  async function loadMore() {
    if (!user || !otherId || messages.length === 0) return;
    const oldest = messages[0];
    const { data, error } = await supabase
      .from('messages')
      .select('id,sender_id,receiver_id,body,created_at')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`)
      .lt('created_at', oldest.created_at)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);
    if (!error && data) {
      const older = (data as MessageRow[]).slice().reverse();
      setMessages(prev => [...older, ...prev]);
      setHasMore((data as MessageRow[]).length === PAGE_SIZE);
    }
  }

  return { messages, loading, send, hasMore, loadMore };
}

export default function ChatDock() {
  const { user } = useAuth();
  const friends = useAcceptedFriends();
  const [open, setOpen] = useState(false);
  const [activeFriend, setActiveFriend] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const { messages, send, hasMore, loadMore } = useConversation(activeFriend);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  // Persistencia de last_seen usando tabla message_reads
  const [reads, setReads] = useState<Record<string,string>>({});
  // Cargar registros de message_reads propios
  useEffect(() => {
    async function loadReads() {
      if (!user) return;
      const { data, error } = await supabase
        .from('message_reads')
        .select('other_id,last_seen_at')
        .eq('viewer_id', user.id);
      if (!error && data) {
        const map: Record<string,string> = {};
        for (const r of data as any[]) map[r.other_id] = r.last_seen_at;
        setReads(map);
      }
    }
    loadReads();
  }, [user]);

  // Actualizar last_seen al abrir conversación
  useEffect(() => {
    async function touch() {
      if (!user || !activeFriend) return;
      const now = new Date().toISOString();
      setReads(r => ({ ...r, [activeFriend]: now }));
      const { error } = await supabase.from('message_reads').upsert({ viewer_id: user.id, other_id: activeFriend, last_seen_at: now });
      if (error) console.error(error.message);
    }
    touch();
  }, [activeFriend, user]);

  // Unread: mensajes cuyo created_at > last_seen y cuyo sender sea el otro usuario.
  const unread = (otherId: string) => {
    const lastSeenAt = reads[otherId];
    // Buscar último mensaje de la pareja donde sender sea el otro
    const lastMsg = messages.filter(m => (m.sender_id === otherId && m.receiver_id === user?.id) || (m.receiver_id === otherId && m.sender_id === user?.id)).slice(-1)[0];
    if (!lastMsg) return false;
    // Si conversación activa y ya hemos actualizado el read, no mostrar
    if (activeFriend === otherId) return false;
    if (!lastSeenAt) return true; // no existe registro -> todo no leído
    return new Date(lastMsg.created_at) > new Date(lastSeenAt);
  };

  if (!user) return null;

  return (
  <div className="fixed bottom-4 right-4 z-50" role="dialog" aria-label="Chat flotante">
      {!open && (
  <Button onClick={()=>setOpen(true)} className="shadow-lg transition-all duration-300" aria-label="Abrir chat" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setOpen(true); }}>Chat</Button>
      )}
      {open && (
        <div
          className="w-[420px] h-[520px] bg-white rounded-xl shadow-xl flex flex-col border transition-all duration-300 ease-in-out"
          style={{ opacity: open ? 1 : 0, transform: open ? 'scale(1)' : 'scale(0.95)' }}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <span className="font-semibold text-sm">Chat</span>
            <button onClick={()=>setOpen(false)} className="text-xs text-slate-500 hover:text-slate-700 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500" aria-label="Cerrar chat" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setOpen(false); }}>Cerrar</button>
          </div>
          <div className="flex-1 flex">
            <aside className="w-36 border-r overflow-y-auto bg-slate-50/40">
              <ul className="text-[11px]">
                {(friends.data||[]).map(f => (
                  <li key={f.user_id} className="transition-all duration-300">
                    <button
                      onClick={()=>setActiveFriend(f.user_id)}
                      className={`w-full text-left px-2 py-3 hover:bg-white flex items-center gap-2 relative ${activeFriend===f.user_id?'bg-white shadow-inner':''} transition-all duration-200`}
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-200 grid place-items-center text-[11px] font-semibold text-slate-700 overflow-hidden transition-all duration-200">
                        {(f.display_name?.[0] || f.username?.[0] || 'U').toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">@{f.username}</div>
                        <div className="truncate text-[10px] text-slate-500">{f.display_name || '—'}</div>
                      </div>
                      {unread(f.user_id) && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500" />}
                    </button>
                  </li>
                ))}
                {(friends.data||[]).length === 0 && <li className="px-2 py-2 text-[10px] text-slate-400">Sin amigos</li>}
              </ul>
            </aside>
            <section className="flex-1 flex flex-col">
              {!activeFriend && <div className="p-3 text-xs text-slate-500">Selecciona un amigo para conversar.</div>}
              {activeFriend && (
                <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
                  {hasMore && (
                    <div className="flex justify-center">
                      <button onClick={loadMore} className="text-[11px] text-blue-600 hover:underline">Cargar mensajes anteriores</button>
                    </div>
                  )}
                  {messages.map(m => (
                    <div key={m.id} className={`max-w-[75%] px-3 py-2 rounded-lg text-xs ${m.sender_id===user.id?'bg-blue-600 text-white ml-auto':'bg-slate-100 text-slate-700'}`}>{m.body}</div>
                  ))}
                  <div ref={endRef} />
                </div>
              )}
              <form
                onSubmit={e=>{e.preventDefault(); send(input); setInput('');}}
                className="p-2 border-t flex gap-2"
              >
                <input
                  value={input}
                  onChange={e=>setInput(e.target.value)}
                  placeholder="Escribe un mensaje"
                  className="flex-1 px-2 py-1 border rounded text-xs"
                  disabled={!activeFriend}
                />
                <Button type="submit" className="text-xs" disabled={!activeFriend || !input.trim()}>Enviar</Button>
              </form>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
