import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Card } from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import { RankBadge } from '@/components/ui/RankBadge';
import { getProgressToNextRank } from '@/lib/ranks';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useAuth } from '@/hooks/useAuth';

interface RankingRow { user_id: string; display_name: string | null; total_xp: number; }
interface RankingData { ranking: RankingRow[]; userRow: RankingRow | null; position: number | null; totalUsers: number; }

export default function Ranking() {
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery<RankingData>({
    queryKey: ['ranking', user?.id],
    queryFn: async () => {
      const { data: top, error: topError } = await supabase
        .from('users_profile')
        .select('user_id, display_name, total_xp')
        .order('total_xp', { ascending: false })
        .limit(100);
      if (topError) throw topError;
      let userRow: RankingRow | null = null; let position: number | null = null; let totalUsers = 0;
      if (user) {
        const { count: allCount } = await supabase
          .from('users_profile')
          .select('user_id', { head: true, count: 'exact' });
        totalUsers = allCount || 0;
        const { data: selfRows } = await supabase
          .from('users_profile')
          .select('user_id, display_name, total_xp')
          .eq('user_id', user.id)
          .limit(1);
        userRow = selfRows?.[0] || null;
        if (userRow) {
          const { count: higherCount } = await supabase
            .from('users_profile')
            .select('user_id', { head: true, count: 'exact' })
            .gt('total_xp', userRow.total_xp);
          position = (higherCount || 0) + 1;
        }
      }
      return { ranking: (top || []) as RankingRow[], userRow, position, totalUsers };
    },
    staleTime: 60_000,
  });

  const userXp = data?.userRow?.total_xp || 0;
  const progress = getProgressToNextRank(userXp);
  const percentile = data?.position && data.totalUsers > 0 ? Math.round(((data.totalUsers - data.position) / data.totalUsers) * 100) : null;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Ranking Global</h1>
        <p className="text-sm text-slate-600">Sube de rango completando lecciones y acumulando XP.</p>
      </header>
      {user ? (
        <Card className="p-4 rounded-2xl flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 flex items-center gap-4">
            {isLoading ? <Skeleton className="w-12 h-12 rounded-xl" /> : <RankBadge xp={userXp} />}
            <div className="flex flex-col">
              <span className="font-semibold text-slate-800">{data?.userRow?.display_name || 'Yo'}</span>
              {data?.position && <span className="text-xs text-slate-500">Posición #{data.position} de {data.totalUsers}{percentile !== null && ` • Top ${percentile}%`}</span>}
              {progress.next && <span className="text-[11px] text-slate-500 mt-1">Faltan {progress.remaining} XP para {progress.next.label}</span>}
            </div>
          </div>
          {progress.next && <div className="md:w-64"><ProgressBar value={progress.pct} className="mb-1" /><div className="text-[11px] text-slate-500">Progreso hacia {progress.next.label}</div></div>}
        </Card>
      ) : <Card className="p-4 rounded-2xl text-center text-sm text-slate-600">Inicia sesión para ver tu posición.</Card>}

      <section>
        <h2 className="text-lg font-semibold mb-3">Podio</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[0,1,2].map(i => {
            const row = data?.ranking[i];
            return (
              <Card key={i} className="rounded-2xl p-4 flex flex-col items-center gap-2 relative">
                <span className="absolute top-2 right-3 text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded">#{i+1}</span>
                {row ? (
                  <>
                    <span className="text-2xl" aria-hidden>{i===0?'👑':i===1?'🥈':'🥉'}</span>
                    <span className="font-semibold text-center truncate w-full">{row.display_name || 'Usuario ' + row.user_id.slice(0,6)}</span>
                    <span className="text-[11px] text-slate-500">{row.total_xp} XP</span>
                  </>
                ) : <Skeleton className="h-10 w-full" />}
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Top 100</h2>
        <div className="space-y-2">
          {isLoading && Array.from({ length: 8 }).map((_,i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
          {error && <div className="text-red-600 text-sm">{(error as any).message}</div>}
          {data?.ranking.map((row, i) => {
            const isUser = row.user_id === user?.id;
            return (
              <Card key={row.user_id} className={`rounded-xl p-3 flex items-center justify-between ${isUser ? 'ring-2 ring-blue-400 shadow-md' : ''}`}> 
                <div className="flex items-center gap-4">
                  <span className={`text-base font-bold w-8 text-center ${i<3?'text-indigo-600':'text-slate-600'}`}>{i+1}</span>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm truncate max-w-[160px]">{row.display_name || 'Usuario ' + row.user_id.slice(0,6)}</span>
                    <span className="text-[11px] text-slate-500">{row.total_xp} XP</span>
                  </div>
                </div>
                <RankBadge xp={row.total_xp} />
              </Card>
            );
          })}
          {data && data.ranking.length === 0 && !isLoading && <div className="text-center text-slate-500 text-sm">Sin datos de ranking todavía.</div>}
        </div>
      </section>
    </div>
  );
}
