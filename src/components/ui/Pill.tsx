export default function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={"inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold shadow-sm " + (className||'')}>{children}</span>;
}