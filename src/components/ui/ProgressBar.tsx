export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className={"h-3 bg-slate-200 rounded-xl overflow-hidden " + (className||'')}>
      <div className="h-full bg-gradient-to-r from-brand-green to-brand-yellow" style={{ width: pct + '%' }} />
    </div>
  );
}