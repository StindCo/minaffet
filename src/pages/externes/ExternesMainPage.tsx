import { useState, useMemo } from 'react';
import {
  TableIcon, LayoutGrid, Globe, Download, Plus, Search, SlidersHorizontal, X,
  Globe2, Users, AlertTriangle, Clock, ChevronLeft, ChevronRight, BarChart2,
} from 'lucide-react';
import { useAgentsExternes, useStatsExternes, useExportAgentsExternes } from '../../hooks/useAgentsExternes';
import { useRegions } from '../../hooks/useRegions';
import { usePays } from '../../hooks/usePays';
import { AgentTableView } from '../../components/externes/AgentTableView';
import { AgentTilesView } from '../../components/externes/AgentTilesView';
import { AgentGlobeView } from '../../components/externes/AgentGlobeView';
import { AgentMapView } from '../../components/externes/AgentMapView';
import { AgentExterneFormModal } from '../../components/externes/AgentExterneFormModal';
import { ExternesStatsPanel } from '../../components/externes/ExternesStatsPanel';
import type { AgentExterne, AgentGrade, TypeAgent, ProvinceRDC } from '../../types';
import { PROVINCE_LABELS, STATUT_MUTATION_LABELS, TYPE_AGENT_LABELS } from '../../types';
import { AGENT_GRADE_LABELS, cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

// Export CSV natif
function toCsv(rows: Record<string, string | number>[]) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(';')];
  for (const row of rows) {
    lines.push(headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(';'));
  }
  return lines.join('\n');
}

type ViewMode = 'table' | 'tiles' | 'globe' | 'map';

const GRADES: AgentGrade[] = [
  'AMBASSADEUR','MINISTRE_CONSEILLER','CONSEILLER','PREMIER_SECRETAIRE',
  'DEUXIEME_SECRETAIRE','TROISIEME_SECRETAIRE','ATTACHE',
  'CONSUL_GENERAL','CONSUL','VICE_CONSUL',
];

// Suppress unused import warning
void STATUT_MUTATION_LABELS;

export function ExternesMainPage() {
  const { canWrite } = useAuthStore();
  const [view, setView] = useState<ViewMode>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [editAgent, setEditAgent] = useState<AgentExterne | null>(null);
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState({
    search: '',
    typeAgent: '' as TypeAgent | '',
    grade: '' as AgentGrade | '',
    regionId: '',
    paysId: '',
    provinceOrigine: '' as ProvinceRDC | '',
    sexe: '',
  });

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter((v) => v !== '').length,
    [filters]
  );

  const { data: statsData } = useStatsExternes();
  const stats = statsData?.data;

  const { data: regionsData } = useRegions();
  const regions = regionsData?.data ?? [];

  const { data: paysData } = usePays(filters.regionId || undefined);
  const paysList = paysData?.data ?? [];

  const queryFilters = useMemo(() => ({
    ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')),
    page,
    limit: view === 'globe' ? 500 : 20,
  }), [filters, page, view]);

  const { data, isLoading } = useAgentsExternes(queryFilters);
  const agents = data?.data ?? [];
  const pagination = data?.pagination;

  const exportMutation = useExportAgentsExternes();

  async function handleExport() {
    try {
      const res = await exportMutation.mutateAsync({
        typeAgent: filters.typeAgent || undefined,
        regionId: filters.regionId || undefined,
        paysId: filters.paysId || undefined,
      });
      const csv = toCsv(res.data);
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agents-exterieurs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Erreur lors de l\'export');
    }
  }

  function clearFilters() {
    setFilters({ search: '', typeAgent: '', grade: '', regionId: '', paysId: '', provinceOrigine: '', sexe: '' });
    setPage(1);
  }

  function updateFilter(key: keyof typeof filters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value, ...(key === 'regionId' ? { paysId: '' } : {}) }));
    setPage(1);
  }

  const isGlobeView = view === 'globe' || view === 'map';

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-6">

      {/* ── KPI Stats ─────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard icon={<Users size={18} className="text-rdc-navy" />} label="Total personnel" value={stats?.total ?? '—'} bg="bg-white" />
        <StatCard icon={<Globe2 size={18} className="text-rdc-blue" />} label="Diplomates" value={stats?.diplomates ?? '—'} bg="bg-rdc-blue/5" accent="text-rdc-blue" />
        <StatCard icon={<Users size={18} className="text-violet-600" />} label="Hors cadres" value={stats?.horsCadres ?? '—'} bg="bg-violet-50" accent="text-violet-700" />
        <StatCard icon={<AlertTriangle size={18} className="text-rdc-red" />} label="Fin de terme" value={stats?.finTerme ?? '—'} bg="bg-rdc-red/5" accent="text-rdc-red" />
        <StatCard icon={<Clock size={18} className="text-amber-500" />} label="Court terme" value={stats?.courtTerme ?? '—'} bg="bg-amber-50" accent="text-amber-700" />
        <div className="bg-rdc-navy rounded-xl p-3.5 border border-rdc-navy-border col-span-1">
          <p className="text-white/50 text-xs uppercase tracking-wide mb-1.5 font-semibold">Régions actives</p>
          <div className="flex flex-wrap gap-1">
            {stats?.parRegion.filter((r) => r.totalAgents > 0).map((r) => (
              <span key={r.id} className="px-1.5 py-0.5 bg-white/10 rounded text-white text-[10px] font-semibold">
                {r.code} <span className="text-white/50">{r.totalAgents}</span>
              </span>
            ))}
            {!stats?.parRegion.some((r) => r.totalAgents > 0) && (
              <span className="text-white/30 text-xs">—</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Layout principal : contenu + sidebar stats ─ */}
      <div className={cn('flex gap-4', isGlobeView ? 'flex-col' : 'flex-row items-start')}>

        {/* ── Zone principale ────────────────────────── */}
        <div className="flex-1 min-w-0 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">

          {/* Toolbar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 flex-wrap">

            {/* Recherche */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                placeholder="Rechercher un membre du personnel…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rdc-blue/30 focus:border-rdc-blue"
              />
              {filters.search && (
                <button onClick={() => updateFilter('search', '')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={12} />
                </button>
              )}
            </div>

            <select
              value={filters.typeAgent}
              onChange={(e) => updateFilter('typeAgent', e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rdc-blue/30"
            >
              <option value="">Tous les types</option>
              {(['DIPLOMATE', 'HORS_CADRE'] as TypeAgent[]).map((t) => (
                <option key={t} value={t}>{TYPE_AGENT_LABELS[t]}</option>
              ))}
            </select>

            <select
              value={filters.regionId}
              onChange={(e) => updateFilter('regionId', e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rdc-blue/30"
            >
              <option value="">Toutes les régions</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>{r.nom}</option>
              ))}
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors',
                showFilters || activeFilterCount > 0
                  ? 'bg-rdc-blue text-white border-rdc-blue'
                  : 'text-slate-500 border-slate-200 hover:bg-slate-50'
              )}
            >
              <SlidersHorizontal size={14} />
              Filtres
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.5 bg-white/20 rounded text-[10px] font-bold">{activeFilterCount}</span>
              )}
            </button>

            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-slate-400 hover:text-slate-600 text-xs underline">
                Réinitialiser
              </button>
            )}

            <div className="flex-1" />

            {/* Vue switcher */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
              {([
                { mode: 'table' as ViewMode, icon: <TableIcon size={14} />, label: 'Tableau' },
                { mode: 'tiles' as ViewMode, icon: <LayoutGrid size={14} />, label: 'Tuiles' },
                { mode: 'map' as ViewMode, icon: <Globe size={14} />, label: 'Carte' },
                { mode: 'globe' as ViewMode, icon: <Globe size={14} />, label: 'Globe' },
              ] as const).map(({ mode, icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setView(mode)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                    view === mode
                      ? 'bg-white text-rdc-navy shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                  )}
                >
                  {icon} {label}
                </button>
              ))}
            </div>

            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Download size={14} />
              Exporter
            </button>

            {canWrite() && (
              <button
                onClick={() => { setEditAgent(null); setShowModal(true); }}
                className="flex items-center gap-1.5 px-4 py-2 bg-rdc-blue text-white text-sm font-semibold rounded-lg hover:bg-rdc-blue-dark transition-colors"
              >
                <Plus size={14} /> Ajouter membre
              </button>
            )}
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <select value={filters.grade} onChange={(e) => updateFilter('grade', e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                <option value="">Tous les grades</option>
                {GRADES.map((g) => <option key={g} value={g}>{AGENT_GRADE_LABELS[g]}</option>)}
              </select>

              <select value={filters.paysId} onChange={(e) => updateFilter('paysId', e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                <option value="">Tous les pays</option>
                {paysList.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
              </select>

              <select value={filters.provinceOrigine} onChange={(e) => updateFilter('provinceOrigine', e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                <option value="">Toutes les provinces</option>
                {(Object.keys(PROVINCE_LABELS) as ProvinceRDC[]).map((p) => (
                  <option key={p} value={p}>{PROVINCE_LABELS[p]}</option>
                ))}
              </select>

              <select value={filters.sexe} onChange={(e) => updateFilter('sexe', e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white">
                <option value="">Tous les sexes</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>

              <div className="text-xs text-slate-400 flex items-center">
                {pagination?.total ?? 0} membre(s) trouvé(s)
              </div>
            </div>
          )}

          {/* Vue principale */}
          <div className="min-h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-24 text-slate-400">
                <div className="animate-spin w-6 h-6 border-2 border-rdc-blue border-t-transparent rounded-full mr-3" />
                Chargement…
              </div>
            ) : view === 'table' ? (
              <AgentTableView
                agents={agents}
                onEdit={(a) => { setEditAgent(a); setShowModal(true); }}
              />
            ) : view === 'tiles' ? (
              <AgentTilesView agents={agents} />
            ) : view === 'map' ? (
              <AgentMapView agents={agents} />
            ) : (
              <AgentGlobeView agents={agents} />
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && !isGlobeView && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <p className="text-sm text-slate-400">
                Page {pagination.page} sur {pagination.totalPages} · {pagination.total} membre(s) du personnel
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft size={12} /> Préc.
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
                >
                  Suiv. <ChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar statistiques ───────────────────── */}
        {!isGlobeView && (
          <div className="w-64 xl:w-72 shrink-0">
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              {/* Header sidebar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <BarChart2 size={15} className="text-rdc-blue" />
                  <span className="text-sm font-semibold text-slate-700">Statistiques</span>
                </div>
                <button
                  onClick={() => setShowStats((s) => !s)}
                  className="text-slate-300 hover:text-slate-500 text-xs transition-colors"
                >
                  {showStats ? '▲ Réduire' : '▼ Étendre'}
                </button>
              </div>

              {showStats && (
                <div className="p-3">
                  <ExternesStatsPanel agents={agents} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <AgentExterneFormModal
          agent={editAgent}
          onClose={() => { setShowModal(false); setEditAgent(null); }}
        />
      )}
    </div>
  );
}

function StatCard({
  icon, label, value, bg = 'bg-white', accent = 'text-slate-800',
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  bg?: string;
  accent?: string;
}) {
  return (
    <div className={cn('rounded-xl p-3.5 border border-slate-100', bg)}>
      <div className="flex items-center justify-between mb-2">
        <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center">{icon}</div>
      </div>
      <p className={cn('font-bold text-2xl leading-none mb-0.5', accent)}>{value}</p>
      <p className="text-slate-400 text-xs">{label}</p>
    </div>
  );
}
