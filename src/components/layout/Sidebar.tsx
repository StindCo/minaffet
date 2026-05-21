import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Briefcase, Calendar,
  Search, MapPin, Building2, ShieldCheck, LogOut,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

// Couleurs navy RDC — définies ici pour fiabilité totale
const NAV = {
  bg:      '#0D2B6E',
  hover:   '#1A3A82',
  active:  '#1E4599',
  border:  '#2A5299',
  blue:    '#007FFF',
  yellow:  '#F7D618',
};

const navItems = [
  { to: '/',           icon: LayoutDashboard, label: 'Tableau de bord', exact: true },
  { to: '/missions',   icon: Briefcase,        label: 'Missions' },
  { to: '/agents',     icon: Users,            label: 'Agents' },
  { to: '/calendrier', icon: Calendar,         label: 'Calendrier' },
  { to: '/tracker',    icon: Search,           label: 'Agent Tracker' },
  { to: '/carte',      icon: MapPin,           label: 'Carte Monde' },
  { to: '/directions', icon: Building2,        label: 'Directions' },
];

function NavItem({ to, icon: Icon, label, exact = false }: {
  to: string; icon: React.ElementType; label: string; exact?: boolean;
}) {
  return (
    <NavLink to={to} end={exact}>
      {({ isActive }) => (
        <div
          className="relative flex items-center gap-3 px-3 py-[9px] rounded-md text-[13px] font-medium transition-all cursor-pointer select-none"
          style={{
            backgroundColor: isActive ? NAV.active : 'transparent',
            color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
          }}
          onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = NAV.hover; }}
          onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
        >
          {/* Indicateur actif gauche */}
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-white rounded-r-full" />
          )}
          <Icon size={15} style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.5)', flexShrink: 0 }} />
          <span className="truncate">{label}</span>
        </div>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.profil === 'ADMIN';

  return (
    <aside
      className="fixed inset-y-0 left-0 z-50 w-56 flex flex-col"
      style={{ backgroundColor: NAV.bg }}
    >
      {/* ── Logo ───────────────────────────────────────────── */}
      <div
        className="flex flex-col items-center gap-2 px-4 py-5"
        style={{ borderBottom: `1px solid ${NAV.border}` }}
      >
        <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg">
          <img src="/logo.webp" alt="MINAFFET" className="w-11 h-11 object-contain" />
        </div>
        <div className="text-center">
          <p className="text-white font-bold text-[13px] leading-tight tracking-wide">MINAFFET</p>
          <p className="text-[10px] leading-tight mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Affaires Étrangères · RDC
          </p>
        </div>
        {/* Bande tricolore */}
        <div className="flex gap-1 mt-0.5">
          <div className="w-6 h-0.5 rounded" style={{ backgroundColor: NAV.blue, opacity: 0.9 }} />
          <div className="w-3 h-0.5 rounded" style={{ backgroundColor: NAV.yellow }} />
          <div className="w-3 h-0.5 rounded bg-rdc-red" />
        </div>
      </div>

      {/* ── Navigation ──────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <p
          className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.28)' }}
        >
          Menu
        </p>

        <div className="space-y-0.5">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </div>

        {/* ── Admin ──────────────────────────────────────────── */}
        {isAdmin && (
          <div className="mt-4">
            <p
              className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.28)' }}
            >
              Administration
            </p>
            <NavLink to="/utilisateurs">
              {({ isActive }) => (
                <div
                  className="relative flex items-center gap-3 px-3 py-[9px] rounded-md text-[13px] font-medium transition-all cursor-pointer"
                  style={{
                    backgroundColor: isActive ? NAV.active : 'transparent',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                  }}
                  onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = NAV.hover; }}
                  onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                >
                  {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-white rounded-r-full" />}
                  <ShieldCheck size={15} style={{ color: isActive ? '#fff' : NAV.yellow, flexShrink: 0 }} />
                  <span>Utilisateurs</span>
                </div>
              )}
            </NavLink>
          </div>
        )}
      </nav>

      {/* ── Profil ─────────────────────────────────────────── */}
      <div
        className="px-3 py-3 flex items-center gap-2.5"
        style={{ borderTop: `1px solid ${NAV.border}` }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-[11px] font-bold"
          style={{ backgroundColor: NAV.blue }}
        >
          {user?.nom?.[0]}{user?.prenom?.[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-[12px] font-semibold truncate leading-tight">
            {user?.prenom} {user?.nom}
          </p>
          <p className="text-[10px] truncate leading-tight" style={{ color: 'rgba(255,255,255,0.38)' }}>
            {user?.profil === 'ADMIN' ? 'Administrateur'
              : user?.profil === 'ENCODEUR' ? 'Encodeur' : 'Lecteur'}
          </p>
        </div>
        <button
          onClick={() => { logout(); navigate('/login', { replace: true }); }}
          title="Se déconnecter"
          className="p-1.5 rounded-md transition-colors shrink-0"
          style={{ color: 'rgba(255,255,255,0.35)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.backgroundColor = NAV.hover; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'; (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}
