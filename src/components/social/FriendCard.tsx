import React from 'react';
import { useNavigate } from 'react-router-dom';
import { resolveAvatar } from '@/lib/avatars';
import Button from '@/components/ui/Button';

export interface FriendCardProps {
  userId: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  xp?: number;
  bio?: string | null;
  state: 'self' | 'none' | 'outgoing' | 'incoming' | 'accepted' | 'rejected';
  onSend?: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  onRemove?: () => void;
  link?: string;
  compact?: boolean;
  hideBio?: boolean; // fuerza ocultar bio para vistas como Comunidad
}

export function FriendCard({ userId, username, displayName, avatarUrl, xp, bio, state, onSend, onAccept, onReject, onRemove, link, compact, hideBio }: FriendCardProps) {
  const av = resolveAvatar(avatarUrl || null);
  const navigate = useNavigate();
  const clickable = !!link;
  // Más grande y con layout estable para nombres largos.
  return (
    <div
      role="group"
      aria-label={`Perfil de ${displayName || username || 'usuario'}`}
      onClick={() => { if (clickable) navigate(link!); }}
      className={`group rounded-2xl border bg-white ${compact ? 'p-4' : 'p-6'} flex ${compact ? 'flex-col items-center text-center' : 'items-start gap-5'} hover:shadow-lg transition-all duration-300 ease-in-out relative min-w-[220px] w-full h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
      tabIndex={clickable ? 0 : -1}
      style={{ minHeight: compact ? 240 : 200, height: '100%', opacity: 1, transform: 'scale(1)', transition: 'opacity 0.3s, transform 0.3s' }}
      onKeyDown={e => { if (clickable && (e.key === 'Enter' || e.key === ' ')) { navigate(link!); } }}
    >
      <div className={`overflow-hidden rounded-2xl ${compact ? 'w-20 h-20' : 'w-24 h-24'} bg-slate-100 grid place-items-center text-2xl font-bold text-slate-700`}>
  {av.type === 'url' ? <img src={av.url} alt={`Avatar de ${displayName || username || 'usuario'}`} className="w-full h-full object-cover"/> : av.type === 'preset' ? <div className={`w-full h-full ${av.preset.bg} grid place-items-center text-3xl`} aria-label="Avatar por defecto">{av.preset.icon}</div> : <span aria-label="Inicial de usuario">{(username?.[0] || displayName?.[0] || 'U').toUpperCase()}</span>}
      </div>
      <div className={`flex-1 flex flex-col ${compact ? 'items-center' : ''}`}>
        <div className="font-semibold text-sm md:text-base break-words">@{username || 'usuario'}</div>
        <div className="text-xs md:text-sm text-slate-600 break-words">{displayName || '—'}{xp !== undefined && ` • ${xp} XP`}</div>
        {!hideBio && !compact && bio !== undefined && (
          <p className="text-xs md:text-sm text-slate-600 mt-3 line-clamp-3">{bio || 'Sin bio.'}</p>
        )}
        {clickable && <span className="absolute top-2 right-2 text-[10px] text-blue-500 opacity-0 group-hover:opacity-100 transition">Ver perfil</span>}
      </div>
      <div className={`absolute inset-x-0 bottom-0 px-4 pb-4 pt-3 flex flex-col ${compact ? 'items-center' : 'items-end'} gap-1 bg-gradient-to-t from-white via-white/90 to-transparent`} onClick={e=>e.stopPropagation()}>
        {state === 'self' && <span className="text-[10px] text-slate-400">Tú</span>}
        {state === 'none' && onSend && <Button onClick={onSend} className="text-[11px] h-7 px-3">Agregar</Button>}
        {state === 'outgoing' && <span className="text-[10px] text-blue-600">Solicitud enviada</span>}
        {state === 'incoming' && (
          <div className="flex gap-1">
            {onAccept && <Button onClick={onAccept} className="text-[11px] h-7 px-3">Aceptar</Button>}
            {onReject && <Button variant="ghost" onClick={onReject} className="text-[11px] h-7 px-3">Rechazar</Button>}
          </div>
        )}
        {state === 'accepted' && (
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-emerald-600">Amigos</span>
            {onRemove && <button onClick={onRemove} className="text-red-500 hover:underline">Eliminar</button>}
          </div>
        )}
        {state === 'rejected' && <span className="text-[10px] text-red-500">Rechazado</span>}
      </div>
    </div>
  );
}

export default FriendCard;
