import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationRow { id: string; title: string; body: string | null; read_at: string | null; created_at: string; }

async function fetchNotifications(): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id,title,body,read_at,created_at')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data as NotificationRow[];
}

async function markRead(id: string) {
  const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export default function Notifications() {
  const qc = useQueryClient();
  const { data, isLoading, error, markRead, markAllRead, unreadCount } = useNotifications() as any;
  const { user } = useAuth();
  const pendingRequests = useQuery<{ count: number }>({
    queryKey: ['friend-requests-pending-count'],
    queryFn: async () => {
      if (!user) return { count: 0 };
      const { data, error } = await supabase
        .from('friend_requests')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('status', 'pending');
      if (error) throw error;
      return { count: data?.length || 0 };
    },
    staleTime: 15000,
    enabled: !!user
  });
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Notificaciones</h1>
        {unreadCount > 0 && (
          <Button variant="secondary" onClick={()=>markAllRead()}>Marcar todas</Button>
        )}
      </div>
      {isLoading && <div>Cargando...</div>}
      {error && <div className="text-red-600">{(error as any).message}</div>}
      {pendingRequests.data && pendingRequests.data.count > 0 && (
        <div className="mb-4 text-sm px-3 py-2 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800">
          Tienes {pendingRequests.data.count} solicitud(es) de amistad pendiente(s).
        </div>
      )}
      <div className="space-y-3">
  {data?.map((n: NotificationRow) => (
          <Card key={n.id} className={"flex flex-col gap-2 " + (n.read_at ? 'opacity-60' : '')}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-sm mb-1">{n.title}</h3>
                {n.body && <p className="text-xs text-slate-600 leading-relaxed">{n.body}</p>}
                <p className="text-[10px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              {!n.read_at && (
    <Button variant="secondary" onClick={() => markRead(n.id)}>Marcar leído</Button>
              )}
            </div>
          </Card>
        ))}
        {data?.length === 0 && !isLoading && (
          <div className="text-center text-slate-500">No tienes notificaciones.</div>
        )}
      </div>
    </div>
  );
}
