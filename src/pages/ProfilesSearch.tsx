import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Card } from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import { RankBadge } from '@/components/ui/RankBadge';
import { Link } from 'react-router-dom';

interface ProfileResult {
  user_id: string;
  username: string | null;
  display_name: string | null;
  total_xp: number;
  show_progress: boolean;
}

export default function ProfilesSearch() {
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 400);

  const { data, isLoading } = useQuery<ProfileResult[]>({
    queryKey: ['profiles-search', debounced],
    queryFn: async () => {
      if (!debounced) return [] as ProfileResult[];
      const { data, error } = await supabase
        .from('users_profile')
        .select('user_id, username, display_name, total_xp, show_progress')
        .or(`username.ilike.%${debounced}%,display_name.ilike.%${debounced}%`)
        .order('total_xp', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as ProfileResult[];
    },
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-6">Buscar perfiles</h1>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por usuario o nombre"
        className="w-full px-4 py-2 border rounded-xl mb-6 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      <div className="space-y-2">
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        )}
  {!isLoading && (data?.length === 0) && debounced && (
          <p className="text-sm text-slate-500">Sin resultados.</p>
        )}
  {data?.map((row: ProfileResult) => (
          <Card key={row.user_id} className="p-4 rounded-xl flex items-center justify-between">
            <div className="flex flex-col">
              <Link to={`/u/${row.username}`} className="font-semibold text-blue-600 hover:underline">@{row.username}</Link>
              <span className="text-xs text-slate-500">{row.display_name || '—'}</span>
            </div>
            {row.show_progress ? <RankBadge xp={row.total_xp} /> : <span className="text-xs text-slate-400">Progreso oculto</span>}
          </Card>
        ))}
      </div>
    </div>
  );
}

function useDebounce(value: string, ms: number) {
  const [d, setD] = useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setD(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return d;
}
