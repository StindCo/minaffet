import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Search, MapPin, Calendar, Users, Layers,
  ChevronRight, MoreHorizontal, Pencil, Trash2, ExternalLink,
} from 'lucide-react';
import { useMissions, useDeleteMission, useUpdateMissionStatus } from '../hooks/useMissions';
import { useAuthStore } from '../store/authStore';
import { MISSION_TYPE_LABELS, MISSION_STATUS_LABELS, formatDate, cn } from '../lib/utils';
import type { Mission, MissionStatus, MissionType } from '../types';

// ── Couleurs statut ───────────────────────────────────────
const STATUS_STYLE: Record<MissionStatus, { dot: string; bg: string; text: string }> = {
  PLANIFIEE:  { dot: 'bg-slate-400',  bg: 'bg-slate-100',  text: 'text-slate-600'  },
  EN_COURS:   { dot: 'bg-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  TERMINEE:   { dot: 'bg-blue-400',   bg: 'bg-blue-50',    text: 'text-blue-700'   },
  SUSPENDUE:  { dot: 'bg-amber-400',  bg: 'bg-amber-50',   text: 'text-amber-700'  },
  ANNULEE:    { dot: 'bg-red-400',    bg: 'bg-red-50',     text: 'text-red-700'    },
};

const TYPE_STYLE: Record<MissionType, string> = {
  DIPLOMATIQUE:  'bg-indigo-50 text-indigo-700',
  ECONOMIQUE:    'bg-emerald-50 text-emerald-700',
  CONSULAIRE:    'bg-violet-50 text-violet-700',
  SECURITAIRE:   'bg-red-50 text-red-700',
  CULTURELLE:    'bg-orange-50 text-orange-700',
  HUMANITAIRE:   'bg-pink-50 text-pink-700',
  MULTILATERALE: 'bg-cyan-50 text-cyan-700',
};

const STATUTS: MissionStatus[] = ['PLANIFIEE', 'EN_COURS', 'TERMINEE', 'SUSPENDUE', 'ANNULEE'];

// ── Page ──────────────────────────────────────────────────
export function MissionsPage() {
  const navigate = useNavigate();
  const { isAdmin, canWrite, canDelete } = useAuthStore();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<MissionStatus | ''>('');
  const [type, setType] = useState<MissionType | ''>('');
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { data, isLoading } = useMissions({ search: search || undefined, status: status || undefined, type: type || undefined, page, limit: 15 });
  const deleteMission = useDeleteMission();
  const updateStatus = useUpdateMissionStatus();

  const missions = data?.data ?? [];
  const stats = data?.stats;
  const pagination = data?.pagination;

  const handleDelete = (id: string) => {
    if (confirm('Supprimer cette mission ? Cette action est irréversible.')) {
      deleteMission.mutate(id);
    }
    setOpenMenuId(null);
  };

  const statCards = [
    { label: 'En cours', key: 'EN_COURS', color: 'text-emerald-600', border: 'border-l-emerald-400' },
    { label: 'Planifiées', key: 'PLANIFIEE', color: 'text-slate-600', border: 'border-l-slate-400' },
    { label: 'Terminées', key: 'TERMINEE', color: 'text-blue-600', border: 'border-l-blue-400' },
    { label: 'Annulées', key: 'ANNULEE', color: 'text-red-600', border: 'border-l-red-400' },
  ];

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Missions de Service</h1>
          {pagination && (
            <p className="text-sm text-slate-500 mt-0.5">
              {pagination.total} mission{pagination.total !== 1 ? 's' : ''} au total
            </p>
          )}
        </div>
        {canWrite() && (
          <Link
            to="/missions/new"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-lg transition hover:opacity-90"
            style={{ backgroundColor: '#007FFF' }}
          >
            <Plus size={16} />
            Nouvelle mission
          </Link>
        )}
      </div>

      {/* ── Stats Bar ───────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          {statCards.map(({ label, key, color, border }) => (
            <button
              key={key}
              onClick={() => setStatus(status === key ? '' : key as MissionStatus)}
              className={cn(
                'bg-white rounded-lg border border-slate-200 border-l-4 px-4 py-3 text-left transition-all',
                'hover:shadow-sm hover:border-slate-300',
                border,
                status === key && 'ring-2 ring-blue-500/20'
              )}
            >
              <div className={cn('text-2xl font-bold', color)}>
                {stats[key as MissionStatus] ?? 0}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">{label}</div>
            </button>
          ))}
        </div>
      )}

      {/* ── Filtres ──────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher une mission..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-400 transition-colors"
          />
        </div>

        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as MissionStatus | ''); setPage(1); }}
          className="text-sm border border-slate-200 rounded-md px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-400 text-slate-700 transition-colors"
        >
          <option value="">Tous les statuts</option>
          {STATUTS.map((s) => <option key={s} value={s}>{MISSION_STATUS_LABELS[s]}</option>)}
        </select>

        <select
          value={type}
          onChange={(e) => { setType(e.target.value as MissionType | ''); setPage(1); }}
          className="text-sm border border-slate-200 rounded-md px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-400 text-slate-700 transition-colors"
        >
          <option value="">Tous les types</option>
          {Object.entries(MISSION_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>

        {(search || status || type) && (
          <button
            onClick={() => { setSearch(''); setStatus(''); setType(''); setPage(1); }}
            className="text-xs text-slate-500 hover:text-slate-800 underline transition-colors"
          >
            Effacer les filtres
          </button>
        )}
      </div>

      {/* ── Liste ────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="space-y-px">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-[72px] bg-slate-50 animate-pulse border-b border-slate-100 last:border-0" />
            ))}
          </div>
        ) : missions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <Layers size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-600 font-semibold">Aucune mission trouvée</p>
            <p className="text-slate-400 text-sm mt-1">
              {search || status || type ? 'Modifiez vos critères de recherche' : 'Créez votre première mission'}
            </p>
            {canWrite() && !search && !status && !type && (
              <Link
                to="/missions/new"
                className="mt-4 flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
              >
                <Plus size={15} /> Créer une mission
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {missions.map((m) => (
              <MissionRow
                key={m.id}
                mission={m}
                isMenuOpen={openMenuId === m.id}
                onMenuToggle={() => setOpenMenuId(openMenuId === m.id ? null : m.id)}
                onView={() => { navigate(`/missions/${m.id}`); setOpenMenuId(null); }}
                onEdit={() => { navigate(`/missions/${m.id}/edit`); setOpenMenuId(null); }}
                onDelete={() => handleDelete(m.id)}
                onStatusChange={(s) => { updateStatus.mutate({ id: m.id, status: s }); setOpenMenuId(null); }}
                canWrite={canWrite()}
                canDelete={canDelete()}
                isAdmin={isAdmin()}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Pagination ───────────────────────────────────── */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Page {page} sur {pagination.totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="px-3 py-1.5 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              Précédent
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === pagination.totalPages}
              className="px-3 py-1.5 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Ligne de mission ──────────────────────────────────────
function MissionRow({
  mission, isMenuOpen, onMenuToggle, onView, onEdit, onDelete, onStatusChange, canWrite, canDelete, isAdmin,
}: {
  mission: Mission;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (s: MissionStatus) => void;
  canWrite: boolean;
  canDelete: boolean;
  isAdmin: boolean;
}) {
  const s = STATUS_STYLE[mission.status];
  const dateStr = mission.dateDebut && mission.dateFin
    ? `${formatDate(mission.dateDebut)} → ${formatDate(mission.dateFin)}`
    : '—';

  return (
    <div
      onClick={onView}
      className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/80 cursor-pointer group transition-colors"
    >
      {/* Statut dot */}
      <div className={cn('w-2 h-2 rounded-full flex-shrink-0', s.dot)} />

      {/* Corps principal */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-slate-900 truncate max-w-xs group-hover:text-blue-600 transition-colors">
            {mission.objet}
          </span>
          <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', TYPE_STYLE[mission.type])}>
            {MISSION_TYPE_LABELS[mission.type]}
          </span>
          <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', s.bg, s.text)}>
            {MISSION_STATUS_LABELS[mission.status]}
          </span>
        </div>
        <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
          <span className="font-mono text-slate-400">{mission.reference}</span>
          <span className="flex items-center gap-1">
            <MapPin size={11} />
            {mission.ville}, {mission.pays}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {dateStr}
          </span>
          {(mission._count?.participants ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <Users size={11} />
              {mission._count?.participants} agent{(mission._count?.participants ?? 0) !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Direction */}
      {mission.direction && (
        <span className="hidden lg:block text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded flex-shrink-0">
          {mission.direction.code}
        </span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        {(canWrite || canDelete || isAdmin) && (
          <div className="relative">
            <button
              onClick={onMenuToggle}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal size={16} />
            </button>

            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={onMenuToggle} />
                <div className="absolute right-0 top-8 z-20 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 text-sm">
                  <MenuItem icon={<ExternalLink size={14} />} onClick={onView}>Voir la fiche</MenuItem>
                  {canWrite && (
                    <MenuItem icon={<Pencil size={14} />} onClick={onEdit}>Modifier</MenuItem>
                  )}
                  {isAdmin && (
                    <>
                      <div className="h-px bg-slate-100 my-1" />
                      <div className="px-3 py-1 text-xs text-slate-400 font-medium uppercase tracking-wide">Changer statut</div>
                      {(['EN_COURS', 'SUSPENDUE', 'TERMINEE', 'ANNULEE'] as MissionStatus[]).map((st) => (
                        <MenuItem key={st} icon={<div className={cn('w-2 h-2 rounded-full', STATUS_STYLE[st].dot)} />} onClick={() => onStatusChange(st)}>
                          {MISSION_STATUS_LABELS[st]}
                        </MenuItem>
                      ))}
                    </>
                  )}
                  {canDelete && (
                    <>
                      <div className="h-px bg-slate-100 my-1" />
                      <button
                        onClick={onDelete}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                        Supprimer
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}
        <ChevronRight size={15} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
      </div>
    </div>
  );
}

function MenuItem({ icon, onClick, children }: { icon: React.ReactNode; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
    >
      <span className="text-slate-400">{icon}</span>
      {children}
    </button>
  );
}
