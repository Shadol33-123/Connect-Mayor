export interface RankTier {
  id: string;
  label: string;
  minXp: number;
  icon: string;
  gradient: string; // tailwind gradient
  color: string; // text color class
}

export const RANK_TIERS: RankTier[] = [
  { id: 'hierro', label: 'Hierro', minXp: 0, icon: '⚔️', gradient: 'from-slate-300 to-slate-500', color: 'text-slate-700' },
  { id: 'bronce', label: 'Bronce', minXp: 100, icon: '🥉', gradient: 'from-amber-400 to-amber-600', color: 'text-amber-700' },
  { id: 'plata', label: 'Plata', minXp: 300, icon: '🥈', gradient: 'from-gray-300 to-gray-500', color: 'text-gray-600' },
  { id: 'oro', label: 'Oro', minXp: 600, icon: '🥇', gradient: 'from-yellow-300 to-yellow-500', color: 'text-yellow-600' },
  { id: 'platino', label: 'Platino', minXp: 1200, icon: '💎', gradient: 'from-cyan-300 to-indigo-500', color: 'text-cyan-700' },
  { id: 'diamante', label: 'Diamante', minXp: 2500, icon: '🔷', gradient: 'from-sky-300 to-sky-600', color: 'text-sky-700' },
  { id: 'maestro', label: 'Maestro', minXp: 5000, icon: '🧠', gradient: 'from-purple-400 to-fuchsia-600', color: 'text-purple-700' },
];

export function getRankForXp(xp: number): RankTier {
  let current = RANK_TIERS[0];
  for (const tier of RANK_TIERS) {
    if (xp >= tier.minXp) current = tier; else break;
  }
  return current;
}

export function getNextRank(xp: number): RankTier | null {
  const ordered = [...RANK_TIERS].sort((a, b) => a.minXp - b.minXp);
  for (let i = 0; i < ordered.length; i++) {
    if (xp < ordered[i].minXp) return ordered[i];
  }
  return null;
}

export function getProgressToNextRank(xp: number) {
  const current = getRankForXp(xp);
  const next = getNextRank(xp);
  if (!next) return { pct: 100, remaining: 0, current, next: null };
  const span = next.minXp - current.minXp;
  const progressed = xp - current.minXp;
  const pct = Math.min(100, Math.round((progressed / span) * 100));
  const remaining = Math.max(0, next.minXp - xp);
  return { pct, remaining, current, next };
}
