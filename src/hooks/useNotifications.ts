import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

export interface NotificationRow { id: string; title: string; body: string | null; read_at: string | null; created_at: string; }

async function fetchNotifications(): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id,title,body,read_at,created_at')
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  return data as NotificationRow[];
}

async function markRead(id: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

async function markAllRead() {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null);
  if (error) throw error;
}

export function useNotifications() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const query = useQuery({ queryKey: ['notifications'], queryFn: fetchNotifications, staleTime: 30_000 });
  const mutation = useMutation({
    mutationFn: markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const markAll = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // Realtime subscription to new notifications for current user
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (_payload) => {
        // Rather than full refetch immediately, simply invalidate to refresh list and badge
        qc.invalidateQueries({ queryKey: ['notifications'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, qc]);

  const unreadCount = (query.data || []).filter(n => !n.read_at).length;
  return {
    ...query,
    unreadCount,
    markRead: mutation.mutate,
    marking: (mutation as any).isPending,
    markAllRead: markAll.mutate,
    markingAll: (markAll as any).isPending,
  };
}
