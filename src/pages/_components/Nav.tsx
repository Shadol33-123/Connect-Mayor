import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState, useRef } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useUserProfile } from '@/hooks/useUserProfile';
import ProfileEditor from '@/components/ProfileEditor';

export default function Nav() {
  const { signOut, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const { data: notifications, unreadCount, markAllRead } = useNotifications() as {
    data: { id: string; title: string; body: string | null; read_at: string | null; created_at: string; }[] | undefined;
    unreadCount: number; markAllRead: () => void;
  };
  const { data: profile } = useUserProfile();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setNotifOpen(false); setProfileOpen(false); }
    }
    function onClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    window.addEventListener('keydown', onKey);
    window.addEventListener('click', onClick);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('click', onClick); };
  }, []);

  const unread = unreadCount || 0;
  return (
    <nav className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b text-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 group" aria-label="Inicio">
          <img src="/logo.png" alt="Logo" className="w-9 h-9 rounded-full ring-2 ring-blue-100 shadow-sm" />
          <div className="leading-tight">
            <div className="text-xl font-extrabold text-slate-900 group-hover:text-blue-700 transition">Connect! Mayor</div>
            <div className="text-[10px] text-orange-500">Modo Desarrollo (Mock DB)</div>
          </div>
        </Link>

        {/* Mobile toggle */}
        <button
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 text-slate-700 aria-expanded:font-bold"
          aria-label="Abrir menú"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? '✕' : '☰'}
        </button>

        {/* Center menu: only when authenticated */}
        <div className="hidden md:flex items-center gap-2">
          <MenuItem to="/" label="Inicio" />
          <MenuItem to="/profile" label="Perfil" />
          <MenuItem to="/lessons" label="Lecciones" />
          <MenuItem to="/ranking" label="Ranking" />
          <MenuItem to="/comunidad" label="Comunidad" />
        </div>

        {/* Right actions */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              {/* Notifications bell */}
              <div ref={notifRef} className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setNotifOpen(o => !o); setProfileOpen(false); }}
                  aria-haspopup="true"
                  aria-expanded={notifOpen}
                  className="relative w-9 h-9 inline-flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                  aria-label={unread ? `Tienes ${unread} notificaciones` : 'Notificaciones'}
                >
                  <span aria-hidden>🔔</span>
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center shadow">
                      {unread}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div
                    role="dialog"
                    aria-label="Panel de notificaciones"
                    aria-modal="true"
                    className="absolute right-0 mt-2 w-80 max-w-[85vw] bg-white rounded-xl shadow-lg border p-3 flex flex-col gap-2 z-30 transition-opacity duration-150 animate-fadeIn"
                  >
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-xs font-semibold text-slate-700">Notificaciones</h3>
                      {unread > 0 && (
                        <button className="text-[11px] text-blue-600 hover:underline" onClick={(e)=>{ e.stopPropagation(); markAllRead(); }}>Marcar todas</button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-auto pr-1">
                      {notifications && notifications.length > 0 ? notifications.slice(0,10).map(n => (
                        <div key={n.id} className={`p-2 rounded-lg text-xs flex flex-col gap-1 ${n.read_at ? 'bg-slate-50 text-slate-500' : 'bg-blue-50'}`}> 
                          <div className="font-medium truncate">{n.title}</div>
                          {n.body && <div className="text-[11px] leading-snug line-clamp-3">{n.body}</div>}
                          <div className="text-[10px] opacity-60">{new Date(n.created_at).toLocaleString()}</div>
                        </div>
                      )) : (
                        <div className="p-2 text-xs text-slate-500">No hay notificaciones.</div>
                      )}
                    </div>
                    <Link to="/notifications" className="text-[11px] text-blue-600 hover:underline self-end">Ver todas →</Link>
                  </div>
                )}
              </div>
              {/* Profile */}
              <div ref={profileRef} className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setProfileOpen(o => !o); setNotifOpen(false); }}
                  aria-haspopup="true"
                  aria-expanded={profileOpen}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-[13px] hover:bg-slate-200"
                  aria-label="Perfil"
                >
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-300 to-slate-200 flex items-center justify-center text-[12px] font-semibold text-slate-700 ring-1 ring-white shadow-inner" aria-hidden>
                    {(profile?.display_name?.[0] || 'U').toUpperCase()}
                  </span>
                  <span className="hidden sm:inline-block font-medium truncate max-w-[90px]">{profile?.display_name || 'Usuario'}</span>
                </button>
                {profileOpen && (
                  <div
                    role="dialog"
                    aria-label="Menú de perfil"
                    aria-modal="true"
                    className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border p-4 flex flex-col gap-3 z-30 transition-opacity duration-150 animate-fadeIn"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-300 to-slate-200 flex items-center justify-center text-sm font-semibold text-slate-700 ring-1 ring-white" aria-hidden>
                        {(profile?.display_name?.[0] || 'U').toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold leading-tight">{profile?.display_name || 'Usuario'}</span>
                        <span className="text-[11px] text-slate-500 truncate max-w-[140px]">{user.email}</span>
                      </div>
                    </div>
                    <ProfileEditor>
                      <button 
                        className="text-sm inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 w-full text-left"
                        onClick={() => setProfileOpen(false)}
                      >
                        <span aria-hidden>✏️</span>
                        <span>Editar perfil</span>
                      </button>
                    </ProfileEditor>
                    <NavLink to="/progress" className="text-sm inline-flex items-center gap-2 text-slate-600 hover:text-blue-600">
                      <span aria-hidden>📈</span>
                      <span>Progreso</span>
                    </NavLink>
                    <Link to="/settings" className="text-sm inline-flex items-center gap-2 text-slate-600 hover:text-blue-600">
                      <span aria-hidden>⚙️</span>
                      <span>Configuración</span>
                    </Link>
                    <button onClick={signOut} className="text-sm inline-flex items-center gap-2 text-red-600 hover:text-red-700">
                      <span aria-hidden>↩️</span> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to="/login" className="inline-flex px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-black text-[13px]">Ingresar</Link>
          )}
        </div>
      </div>

      {/* Mobile drawer (right slide-out) */}
      {open && <MobileDrawer onClose={() => setOpen(false)} userEmail={user?.email} onSignOut={() => { setOpen(false); signOut(); }} />}
    </nav>
  );
}

function MenuItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        (isActive
          ? 'px-3.5 py-2 rounded-xl bg-blue-100 text-blue-700 font-medium text-[13px]'
          : 'px-3.5 py-2 rounded-xl text-slate-700 hover:bg-slate-100 text-[13px]')
      }
      end={to === '/'}
    >
      {label}
    </NavLink>
  );
}

function MobileDrawer({ onClose, userEmail, onSignOut }: { onClose: () => void; userEmail?: string | null; onSignOut: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="md:hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} aria-hidden />
      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        className="fixed top-0 right-0 h-full w-80 max-w-[85%] bg-white z-50 shadow-xl border-l transform transition-transform duration-300 ease-out translate-x-0"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-7 h-7 rounded-full" />
            <span className="font-semibold text-sm">Menú</span>
          </div>
          <button aria-label="Cerrar menú" onClick={onClose} className="w-9 h-9 rounded-lg bg-slate-100">✕</button>
        </div>
        <nav className="p-3 grid gap-1 text-sm">
          <NavLink className="px-3 py-2 rounded-lg hover:bg-slate-100" to="/profile" onClick={onClose}>Perfil</NavLink>
          <NavLink className="px-3 py-2 rounded-lg hover:bg-slate-100" to="/lessons" onClick={onClose}>Lecciones</NavLink>
          <NavLink className="px-3 py-2 rounded-lg hover:bg-slate-100" to="/ranking" onClick={onClose}>Ranking</NavLink>
          <NavLink className="px-3 py-2 rounded-lg hover:bg-slate-100" to="/comunidad" onClick={onClose}>Comunidad</NavLink>
        </nav>
        <div className="mt-auto p-4 border-t">
          {userEmail ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700 truncate max-w-[60%]">{userEmail}</span>
              <button onClick={onSignOut} className="text-red-600 font-medium">Salir</button>
            </div>
          ) : (
            <Link to="/login" onClick={onClose} className="inline-flex px-4 py-2 rounded-xl bg-slate-900 text-white">Ingresar</Link>
          )}
        </div>
      </div>
    </div>
  );
}
