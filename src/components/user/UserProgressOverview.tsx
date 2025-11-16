import { useQuery } from '@tanstack/react-query';
import { getUserProgress } from '@/lib/progress';
import { Card, CardMeta } from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import { ProgressBar } from '@/components/ui/ProgressBar';

export default function UserProgressOverview() {
  const progressQuery = useQuery({ queryKey: ['progress'], queryFn: getUserProgress });

  const lessons = progressQuery.data || [];
  const totalXp = lessons.reduce((a,b)=>a + (b.xp_earned||0), 0);
  const totalCompleted = lessons.length;
  // Placeholder streak logic
  const streakDays = Math.min(totalCompleted, 5);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="rounded-2xl">
          <p className="text-xs text-slate-500">Lecciones completadas</p>
          <div className="mt-1 text-2xl font-bold">{totalCompleted}</div>
        </Card>
        <Card className="rounded-2xl">
          <p className="text-xs text-slate-500">XP acumulado</p>
          <div className="mt-1 text-2xl font-bold">{totalXp}</div>
        </Card>
        <Card className="rounded-2xl">
          <p className="text-xs text-slate-500">Racha</p>
          <div className="mt-1 flex items-center gap-2"><span className="text-xl">🔥</span><span className="font-semibold">{streakDays} días</span></div>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <h2 className="text-lg font-semibold mb-4">Últimas lecciones</h2>
        {progressQuery.isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_,i) => (
              <div key={i}><Skeleton className="h-4 w-1/2 mb-2" /><Skeleton className="h-3 w-full" /></div>
            ))}
          </div>
        )}
        {progressQuery.error && <div className="text-red-600">{(progressQuery.error as any).message}</div>}
        {!progressQuery.isLoading && lessons.slice(0,5).length === 0 && (
          <div className="text-slate-500 text-sm">Todavía no has completado lecciones.</div>
        )}
        <ul className="space-y-3">
          {lessons.slice(0,5).map(l => (
            <li key={l.lesson_id} className="rounded-xl border p-3 bg-white">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-medium truncate max-w-[60%]">{l.lesson_title || l.lesson_id}</div>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded">{l.xp_earned} XP</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{new Date(l.completed_at).toLocaleDateString()}</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">✔ Completada</span>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
