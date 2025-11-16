import { useQuery } from '@tanstack/react-query';
import { getUserProgress, type LessonProgress } from '@/lib/progress';
import { Card } from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import { ProgressBar } from '@/components/ui/ProgressBar';

export default function Progress() {
  const { data, isLoading, error } = useQuery<LessonProgress[]>({
    queryKey: ['progress'],
    queryFn: getUserProgress,
  });
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Tu Progreso</h1>
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><Skeleton className="h-6 w-1/2 mb-3" /><Skeleton className="h-4 w-full" /></Card>
          ))}
        </div>
      )}
      {error && <div className="text-red-600">{(error as any).message}</div>}
      <div className="space-y-4">
        {data?.length === 0 && !isLoading && (
          <div className="text-center text-slate-500">Aún no has completado lecciones.</div>
        )}
        {data?.map(p => (
          <Card key={p.id} className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <div className="text-3xl text-emerald-500">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="text-emerald-400" />
                  <path d="M7 13l3 3 7-7" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{p.lesson_title ?? `Lección ${p.lesson_id}`}</h3>
                  <div className="text-sm text-slate-500">{new Date(p.completed_at).toLocaleDateString()}</div>
                </div>
                <p className="text-sm text-slate-600">Ganaste <strong>{p.xp_earned} XP</strong></p>
              </div>
            </div>
            <div>
              <ProgressBar value={100} className="h-3 rounded-full" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
