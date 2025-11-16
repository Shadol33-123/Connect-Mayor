import { getProgressToNextRank } from '@/lib/ranks';
import { ProgressBar } from './ProgressBar';

export function RankBadge({ xp }: { xp: number }) {
  const { current, next, pct, remaining } = getProgressToNextRank(xp);
  return (
    <div className="flex items-center gap-3">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${current.gradient} shadow ring-2 ring-white flex items-center justify-center text-lg`}> 
        <span aria-hidden>{current.icon}</span>
      </div>
      <div className="flex flex-col leading-tight">
        <span className={`text-sm font-semibold ${current.color}`}>{current.label}</span>
        <span className="text-[11px] text-slate-500">{xp} XP{next && ` • faltan ${remaining} para ${next.label}`}</span>
        {next && <div className="mt-1 w-28"><ProgressBar value={pct} /></div>}
      </div>
    </div>
  );
}
