import { useNavigate } from 'react-router-dom';
import { Globe2, Users, ArrowRight, TrendingUp, AlertTriangle, Clock, ShieldCheck, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useStatsExternes } from '../hooks/useAgentsExternes';

export function WorkspacePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { data: statsData } = useStatsExternes();
  const stats = statsData?.data;

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-rdc-navy relative overflow-hidden flex flex-col">

      {/* Motif de fond décoratif */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-rdc-blue/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-rdc-yellow/5 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[2px] bg-gradient-to-r from-transparent via-rdc-blue/20 to-transparent" />
        {/* Grille subtile */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <img src="/logo.webp" alt="MINAFFET" className="w-9 h-9 object-contain" />
          <div>
            <p className="text-white font-bold text-sm tracking-wide leading-none">MINAFFET</p>
            <p className="text-white/40 text-[10px] uppercase tracking-widest">🇨🇩 · Plateforme Diplomatique</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user?.profil === 'ADMIN' && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-rdc-yellow/20 border border-rdc-yellow/30 rounded-full text-rdc-yellow text-[11px] font-semibold">
              <ShieldCheck size={11} /> Admin
            </span>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10">
            <div className="w-6 h-6 rounded-full bg-rdc-blue flex items-center justify-center text-white text-[10px] font-bold">
              {user?.nom?.[0]}{user?.prenom?.[0]}
            </div>
            <span className="text-white/80 text-sm font-medium">{user?.prenom} {user?.nom}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-white/40 hover:text-white/70 text-sm transition-colors"
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* Corps central */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="text-center mb-12">
          {/* Logo + identité */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-2xl backdrop-blur-sm">
              <img src="/logo.webp" alt="MINAFFET" className="w-14 h-14 object-contain" />
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-[0.25em]">🇨🇩 République Démocratique du Congo</p>
              <p className="text-white/30 text-[10px] uppercase tracking-widest mt-0.5">Ministère des Affaires Étrangères, Coopération Internationale, Francophonie et Diaspora Congolaise</p>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3">
            Choisissez votre espace de travail
          </h1>
          <p className="text-white/50 text-base max-w-xl mx-auto">
            Accédez au module de gestion du personnel diplomatique de la République Démocratique du Congo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">

          {/* ── Card Agents Externes ────────────────── */}
          <button
            onClick={() => navigate('/externes')}
            className="group relative bg-white/5 border border-white/10 rounded-2xl p-8 text-left hover:bg-white/10 hover:border-rdc-blue/50 hover:shadow-2xl hover:shadow-rdc-blue/10 transition-all duration-300 cursor-pointer"
          >
            {/* Accent coloré */}
            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl bg-gradient-to-r from-rdc-blue via-rdc-blue-dark to-rdc-blue opacity-80 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 rounded-xl bg-rdc-blue/20 border border-rdc-blue/30 flex items-center justify-center group-hover:bg-rdc-blue/30 transition-colors">
                <Globe2 size={28} className="text-rdc-blue" />
              </div>
              <ArrowRight size={20} className="text-white/20 group-hover:text-rdc-blue group-hover:translate-x-1 transition-all mt-1" />
            </div>

            <h2 className="text-white text-xl font-bold mb-1">Personnel Extérieur</h2>
            <p className="text-white/40 text-sm mb-6">Diplomates & hors-cadres en poste à l'étranger</p>

            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-white/40 text-[11px] uppercase tracking-wide mb-0.5">Total</p>
                <p className="text-white font-bold text-xl">{stats?.total ?? '—'}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-white/40 text-[11px] uppercase tracking-wide mb-0.5">Diplo.</p>
                <p className="text-rdc-blue font-bold text-xl">{stats?.diplomates ?? '—'}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-white/40 text-[11px] uppercase tracking-wide mb-0.5">H.C.</p>
                <p className="text-rdc-yellow font-bold text-xl">{stats?.horsCadres ?? '—'}</p>
              </div>
            </div>

            {/* Alertes */}
            {stats && (stats.finTerme > 0 || stats.courtTerme > 0) && (
              <div className="mt-4 flex gap-2 flex-wrap">
                {stats.finTerme > 0 && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-rdc-red/20 border border-rdc-red/30 rounded-lg text-rdc-red text-[11px] font-semibold">
                    <AlertTriangle size={10} /> {stats.finTerme} fin de terme
                  </span>
                )}
                {stats.courtTerme > 0 && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-rdc-yellow/20 border border-rdc-yellow/30 rounded-lg text-rdc-yellow text-[11px] font-semibold">
                    <Clock size={10} /> {stats.courtTerme} court terme
                  </span>
                )}
              </div>
            )}
          </button>

          {/* ── Card Agents Internes (désactivé) ───── */}
          <div className="relative bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 text-left opacity-50 cursor-not-allowed">
            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl bg-gradient-to-r from-slate-600 to-slate-500" />

            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 rounded-xl bg-slate-700/30 border border-white/10 flex items-center justify-center">
                <Users size={28} className="text-white/30" />
              </div>
              <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-white/30 text-[11px] font-semibold tracking-wide uppercase">
                Bientôt
              </span>
            </div>

            <h2 className="text-white/50 text-xl font-bold mb-1">Personnel Intérieur</h2>
            <p className="text-white/25 text-sm mb-6">Personnel des directions de Kinshasa</p>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]">
                <p className="text-white/20 text-[11px] uppercase tracking-wide mb-0.5">Total</p>
                <p className="text-white/30 font-bold text-xl">0</p>
              </div>
              <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]">
                <p className="text-white/20 text-[11px] uppercase tracking-wide mb-0.5">Directions</p>
                <p className="text-white/30 font-bold text-xl">0</p>
              </div>
              <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]">
                <p className="text-white/20 text-[11px] uppercase tracking-wide mb-0.5">Missions</p>
                <p className="text-white/30 font-bold text-xl">0</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 p-3 bg-white/[0.03] rounded-xl border border-white/[0.05]">
              <TrendingUp size={14} className="text-white/20" />
              <p className="text-white/20 text-[11px]">Ce module sera disponible dans une prochaine version.</p>
            </div>
          </div>
        </div>

        {/* Régions */}
        {stats && stats.parRegion.length > 0 && (
          <div className="mt-10 w-full max-w-4xl">
            <p className="text-white/30 text-xs uppercase tracking-widest text-center mb-4">Répartition par région</p>
            <div className="flex flex-wrap justify-center gap-3">
              {stats.parRegion.map((r) => (
                <div key={r.id} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
                  <span className="text-white/60 text-xs font-semibold">{r.code}</span>
                  <span className="text-white/30 text-xs">·</span>
                  <span className="text-white text-xs font-bold">{r.totalAgents}</span>
                  <span className="text-white/30 text-xs">personnel</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center pb-5 pt-2">
        <p className="text-white/15 text-[11px]">
          © 2026 · Ministère des Affaires Étrangères, Coopération Internationale, Francophonie et Diaspora Congolaise · 🇨🇩 RDC
        </p>
      </footer>
    </div>
  );
}
