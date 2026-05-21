import { Bell, Settings, ChevronDown, ShieldCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';

const PAGE_TITLES: Record<string, string> = {
  '/':                'Tableau de bord',
  '/missions':        'Missions de service',
  '/missions/new':    'Nouvelle mission',
  '/agents':          'Agents diplomatiques',
  '/calendrier':      'Calendrier des missions',
  '/tracker':         'Agent Tracker',
  '/carte':           'Carte du monde',
  '/directions':      'Directions',
  '/utilisateurs':    'Gestion des utilisateurs',
};

export function Topbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [menuOuvert, setMenuOuvert] = useState(false);

  const title = PAGE_TITLES[pathname]
    ?? (pathname.startsWith('/missions/') ? 'Fiche Mission'
      : pathname.startsWith('/agents/') ? 'Fiche Agent'
      : 'MINAFFET');

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between gap-4">

      {/* Titre uppercase bleu — style référence */}
      <h1 className="text-rdc-navy font-extrabold text-sm uppercase tracking-widest truncate">
        {title}
      </h1>

      {/* Actions droite */}
      <div className="flex items-center gap-1.5 shrink-0">

        {/* Cloche */}
        <button className="w-8 h-8 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
          <Bell size={16} />
        </button>

        {/* Engrenage */}
        <button className="w-8 h-8 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
          <Settings size={16} />
        </button>

        {/* Avatar + menu */}
        <div className="relative ml-1">
          <button
            onClick={() => setMenuOuvert(!menuOuvert)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-rdc-blue flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.nom?.[0]}{user?.prenom?.[0]}
            </div>
            <ChevronDown size={13} className={cn('text-slate-400 transition-transform', menuOuvert && 'rotate-180')} />
          </button>

          {menuOuvert && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOuvert(false)} />
              <div className="absolute right-0 top-[calc(100%+4px)] z-20 w-56 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">

                {/* Header dropdown */}
                <div className="px-4 py-3 bg-rdc-navy">
                  <p className="text-white text-sm font-semibold">{user?.prenom} {user?.nom}</p>
                  <p className="text-white/50 text-xs truncate">{user?.email}</p>
                  <span className={cn(
                    'inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full',
                    user?.profil === 'ADMIN'
                      ? 'bg-rdc-yellow text-rdc-navy'
                      : 'bg-white/20 text-white'
                  )}>
                    {user?.profil === 'ADMIN' && <ShieldCheck size={9} />}
                    {user?.profil === 'ADMIN' ? 'Administrateur'
                      : user?.profil === 'ENCODEUR' ? 'Encodeur' : 'Lecteur'}
                  </span>
                </div>

                <div className="p-1.5">
                  <button
                    onClick={() => { navigate('/settings'); setMenuOuvert(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-slate-600 hover:bg-slate-50 rounded-md transition-colors"
                  >
                    <Settings size={14} className="text-slate-400" />
                    Paramètres du compte
                  </button>

                  {user?.profil === 'ADMIN' && (
                    <button
                      onClick={() => { navigate('/utilisateurs'); setMenuOuvert(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-slate-600 hover:bg-slate-50 rounded-md transition-colors"
                    >
                      <ShieldCheck size={14} className="text-rdc-blue" />
                      Gérer les utilisateurs
                    </button>
                  )}

                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={() => {
                        useAuthStore.getState().logout();
                        navigate('/login', { replace: true });
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-rdc-red hover:bg-rdc-red/5 rounded-md transition-colors"
                    >
                      Se déconnecter
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
