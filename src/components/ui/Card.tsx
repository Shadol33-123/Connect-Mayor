import React from 'react';
export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={"rounded-xl border bg-white shadow-sm p-5 hover:shadow-md transition " + (className||'')}>{children}</div>;
}
export function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="font-semibold text-base mb-2">{children}</h3>;
}
export function CardMeta({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-slate-600">{children}</p>;
}