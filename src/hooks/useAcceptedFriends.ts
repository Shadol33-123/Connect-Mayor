import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

export interface AcceptedFriendProfile { user_id: string; username: string | null; display_name: string | null; avatar_url: string | null; total_xp: number; }

export function useAcceptedFriends() {
  const { user } = useAuth();
  return useQuery<AcceptedFriendProfile[]>({
    queryKey: ['accepted-friends'],
    queryFn: async () => {
      if (!user) return [];
      const { data: rels, error } = await supabase
        .from('friend_requests')
        .select('requester_id, receiver_id, status')
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq('status', 'accepted');
      if (error) throw error;
      const otherIds = (rels||[]).map(r => r.requester_id === user.id ? r.receiver_id : r.requester_id);
      if (otherIds.length === 0) return [];
      const { data: profs, error: pErr } = await supabase
        .from('users_profile')
        .select('user_id, username, display_name, avatar_url, total_xp')
        .in('user_id', otherIds)
        .order('total_xp', { ascending: false });
      if (pErr) throw pErr;
      return (profs||[]) as AcceptedFriendProfile[];
    },
    staleTime: 30000,
    enabled: !!user
  });
}
