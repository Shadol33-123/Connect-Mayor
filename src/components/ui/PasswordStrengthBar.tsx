import React from 'react';
import { passwordStrength } from '@/lib/password';

export function PasswordStrengthBar({ password }: { password: string }) {
  const { score, label, suggestions } = passwordStrength(password);
  const total = 4;
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded ${i < score ? 'bg-green-500' : 'bg-slate-200'} transition`}
          />
        ))}
      </div>
      <div className="text-xs flex items-center gap-2">
        <span className={score >= 3 ? 'text-green-600' : score >= 1 ? 'text-orange-600' : 'text-red-600'}>{label}</span>
        {password && score < 3 && (
          <span className="text-[10px] text-slate-500 truncate max-w-[60%]">
            {suggestions.slice(0,3).join(' · ')}
          </span>
        )}
      </div>
    </div>
  );
}
export default PasswordStrengthBar;
