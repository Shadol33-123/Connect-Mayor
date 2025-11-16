export default function StatBadge({ color, children }: { color: 'cyan'|'indigo'; children: React.ReactNode }) {
  const dot = color === 'cyan' ? 'bg-cyan-300' : 'bg-indigo-300';
  return (
    <div className="flex items-center gap-2 text-blue-100 text-sm">
      <span className={`w-3 h-3 rounded-full ${dot} animate-pulse`} />
      <span className="font-bold">{children}</span>
    </div>
  );
}