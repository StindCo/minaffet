import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Settings, LogOut, Globe2, ChevronDown, ShieldCheck, LayoutDashboard, ArrowLeftRight } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';

export function ExternesLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOuvert, setMenuOuvert] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── Top Navbar ────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-rdc-navy border-b border-rdc-navy-border shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-6 h-[4.25rem] min-h-[4.25rem] flex items-center gap-6">

          {/* Logo + badge */}
          <div className="flex items-center gap-3 shrink-0 mr-4">
            <img src="/logo.webp" alt="MINAFFET" className="w-10 h-10 object-contain" />
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-white font-extrabold text-[15px] tracking-wide leading-none">MINAFFET</span>
              <span className="text-white/30 text-[10px] uppercase tracking-widest mt-0.5">🇨🇩 MINAFFET · Personnel Extérieur</span>
            </div>
            <span className="flex items-center gap-1 px-2.5 py-1 bg-rdc-blue/30 border border-rdc-blue/40 rounded-md text-rdc-blue text-[10px] font-semibold uppercase tracking-wide">
              <Globe2 size={10} /> Extérieurs
            </span>
          </div>

          {/* Navigation links */}
          <div className="flex items-center gap-1 flex-1">
            <NavLink
              to="/externes"
              end
              className={({ isActive }) => cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              )}
            >
              <LayoutDashboard size={14} />
              Tableau de bord
            </NavLink>

            <NavLink
              to="/externes/configuration"
              className={({ isActive }) => cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              )}
            >
              <Settings size={14} />
              Configuration
            </NavLink>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Changer workspace */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 px-3 py-2 text-white/40 hover:text-white/70 text-xs font-medium rounded-md hover:bg-white/5 transition-colors"
            >
              <ArrowLeftRight size={12} />
              Changer d'espace
            </button>

            {/* Séparateur */}
            <div className="h-5 w-[1px] bg-white/10" />

            {/* Avatar + menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOuvert(!menuOuvert)}
                className="flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-white/10 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-rdc-blue flex items-center justify-center text-white text-[11px] font-bold">
                  {user?.nom?.[0]}{user?.prenom?.[0]}
                </div>
                <span className="text-white/80 text-sm font-medium hidden md:block">
                  {user?.prenom} {user?.nom}
                </span>
                <ChevronDown size={12} className={cn('text-white/40 transition-transform', menuOuvert && 'rotate-180')} />
              </button>

              {menuOuvert && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOuvert(false)} />
                  <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
                    <div className="px-4 py-3 bg-rdc-navy">
                      <p className="text-white text-sm font-semibold">{user?.prenom} {user?.nom}</p>
                      <p className="text-white/40 text-xs truncate">{user?.email}</p>
                      {user?.profil === 'ADMIN' && (
                        <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-rdc-yellow text-rdc-navy text-[10px] font-bold rounded-full">
                          <ShieldCheck size={9} /> Administrateur
                        </span>
                      )}
                    </div>
                    <div className="p-1.5 space-y-0.5">
                      {user?.profil === 'ADMIN' && (
                        <button
                          onClick={() => { navigate('/externes/configuration'); setMenuOuvert(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                          <Settings size={13} className="text-slate-400" />
                          Configuration
                        </button>
                      )}
                      <div className="border-t border-slate-100 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-rdc-red hover:bg-rdc-red/5 rounded-lg transition-colors"
                        >
                          <LogOut size={13} />
                          Se déconnecter
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Contenu ──────────────────────────────────────── */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
