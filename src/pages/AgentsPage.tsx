import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, MoreHorizontal, Pencil, Trash2, Eye, UserCheck, MapPin } from 'lucide-react';

import { useAgents, useDeleteAgent, useUpdateAgentStatus } from '../hooks/useAgents';
import { useAuthStore } from '../store/authStore';
import { AGENT_STATUS_LABELS, AGENT_GRADE_LABELS, cn, getPhotoUrl } from '../lib/utils';
import { AgentFormModal } from '../components/agents/AgentFormModal';
import type { Agent, AgentStatus, AgentGrade } from '../types';

// ── Statut couleurs ───────────────────────────────────────
const STATUS_STYLE: Record<AgentStatus, { dot: string; bg: string; text: string }> = {
  EN_POSTE:   { dot: 'bg-emerald-400', bg: 'bg-emerald-50',  text: 'text-emerald-700' },
  EN_MISSION: { dot: 'bg-blue-400',    bg: 'bg-blue-50',     text: 'text-blue-700'    },
  EN_RAPPEL:  { dot: 'bg-amber-400',   bg: 'bg-amber-50',    text: 'text-amber-700'   },
  EN_CONGE:   { dot: 'bg-slate-300',   bg: 'bg-slate-100',   text: 'text-slate-500'   },
  SUSPENDU:   { dot: 'bg-red-400',     bg: 'bg-red-50',      text: 'text-red-700'     },
};

const GRADE_ABBREV: Record<AgentGrade, string> = {
  AMBASSADEUR:          'AMB', MINISTRE_CONSEILLER: 'MC',  CONSEILLER: 'CONS',
  PREMIER_SECRETAIRE:   '1erS', DEUXIEME_SECRETAIRE: '2eS', TROISIEME_SECRETAIRE: '3eS',
  ATTACHE:              'ATT', CONSUL_GENERAL: 'CG', CONSUL: 'CON', VICE_CONSUL: 'VC',
};

const STATUTS: AgentStatus[] = ['EN_POSTE', 'EN_MISSION', 'EN_RAPPEL', 'EN_CONGE', 'SUSPENDU'];

function calcAge(dateNaissance?: string) {
  if (!dateNaissance) return null;
  const diff = Date.now() - new Date(dateNaissance).getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

// ── Page ──────────────────────────────────────────────────
export function AgentsPage() {
  const navigate = useNavigate();
  const { canWrite, canDelete } = useAuthStore();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<AgentStatus | ''>('');
  const [grade, setGrade] = useState<AgentGrade | ''>('');
  const [page, setPage] = useState(1);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [modal, setModal] = useState<{ open: boolean; agent?: Agent }>({ open: false });

  const { data, isLoading } = useAgents({ search: search || undefined, status: status || undefined, grade: grade || undefined, page, limit: 15 });
  const deleteAgent = useDeleteAgent();
  const updateStatus = useUpdateAgentStatus();

  const agents = data?.data ?? [];
  const pagination = data?.pagination;

  const handleDelete = (id: string, nom: string, prenom: string) => {
    if (confirm(`Supprimer l'agent ${prenom} ${nom} ? Cette action est irréversible.`)) {
      deleteAgent.mutate(id);
    }
    setMenuId(null);
  };

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Agents Diplomatiques</h1>
          {pagination && (
            <p className="text-sm text-slate-500 mt-0.5">
              {pagination.total} agent{pagination.total !== 1 ? 's' : ''} enregistré{pagination.total !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {canWrite() && (
          <button
            onClick={() => setModal({ open: true })}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-lg transition hover:opacity-90"
            style={{ backgroundColor: '#007FFF' }}
          >
            <Plus size={16} />
            Nouvel agent
          </button>
        )}
      </div>

      {/* ── Filtres ──────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-52">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Nom, prénom, matricule..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-400 transition-colors"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as AgentStatus | ''); setPage(1); }}
          className="text-sm border border-slate-200 rounded-md px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-400 text-slate-700 transition-colors"
        >
          <option value="">Tous les statuts</option>
          {STATUTS.map((s) => <option key={s} value={s}>{AGENT_STATUS_LABELS[s]}</option>)}
        </select>
        <select
          value={grade}
          onChange={(e) => { setGrade(e.target.value as AgentGrade | ''); setPage(1); }}
          className="text-sm border border-slate-200 rounded-md px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-400 text-slate-700 transition-colors"
        >
          <option value="">Tous les grades</option>
          {Object.entries(AGENT_GRADE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {(search || status || grade) && (
          <button onClick={() => { setSearch(''); setStatus(''); setGrade(''); setPage(1); }} className="text-xs text-slate-500 hover:text-slate-800 underline transition-colors">
            Effacer
          </button>
        )}
      </div>

      {/* ── Table ────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {/* En-tête */}
        <div className="grid grid-cols-[2fr_1.5fr_auto_1.4fr_1.4fr_auto_auto_auto] gap-0 bg-slate-50 border-b border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <span>Nom</span>
          <span>Poste actuel</span>
          <span className="w-20">Statut</span>
          <span>Grade</span>
          <span>Fonction</span>
          <span className="w-28">Matricule</span>
          <span className="w-10 text-center">Sx</span>
          <span className="w-12 text-center">Âge</span>
        </div>

        {isLoading ? (
          <div className="space-y-px">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[60px] bg-slate-50/60 animate-pulse border-b border-slate-100 last:border-0" />
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <UserCheck size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-600 font-semibold">Aucun agent trouvé</p>
            <p className="text-slate-400 text-sm mt-1">
              {search || status || grade ? 'Modifiez vos critères' : 'Ajoutez le premier agent'}
            </p>
            {canWrite() && !search && !status && !grade && (
              <button onClick={() => setModal({ open: true })} className="mt-4 flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline">
                <Plus size={15} /> Ajouter un agent
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {agents.map((agent) => (
              <AgentRow
                key={agent.id}
                agent={agent}
                isMenuOpen={menuId === agent.id}
                onMenuToggle={() => setMenuId(menuId === agent.id ? null : agent.id)}
                onView={() => { navigate(`/agents/${agent.id}`); setMenuId(null); }}
                onEdit={() => { setModal({ open: true, agent }); setMenuId(null); }}
                onDelete={() => handleDelete(agent.id, agent.nom, agent.prenom)}
                onStatusChange={(s) => { updateStatus.mutate({ id: agent.id, status: s }); setMenuId(null); }}
                canWrite={canWrite()}
                canDelete={canDelete()}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Pagination ───────────────────────────────────── */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Page {page} sur {pagination.totalPages} — {pagination.total} agents</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} className="px-3 py-1.5 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 transition-colors">Précédent</button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page === pagination.totalPages} className="px-3 py-1.5 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 transition-colors">Suivant</button>
          </div>
        </div>
      )}

      {/* ── Modal création/édition ───────────────────────── */}
      {modal.open && (
        <AgentFormModal
          agent={modal.agent}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  );
}

// ── Ligne agent ───────────────────────────────────────────
function AgentRow({ agent, isMenuOpen, onMenuToggle, onView, onEdit, onDelete, onStatusChange, canWrite, canDelete }: {
  agent: Agent; isMenuOpen: boolean;
  onMenuToggle: () => void; onView: () => void; onEdit: () => void; onDelete: () => void;
  onStatusChange: (s: AgentStatus) => void; canWrite: boolean; canDelete: boolean;
}) {
  const s = STATUS_STYLE[agent.status];
  const posteActuel = agent.postesAffecter?.[0];
  const age = calcAge(agent.dateNaissance);

  return (
    <div
      onClick={onView}
      className="grid grid-cols-[2fr_1.5fr_auto_1.4fr_1.4fr_auto_auto_auto] gap-0 items-center px-5 py-3.5 hover:bg-slate-50/80 cursor-pointer group transition-colors"
    >
      {/* Nom + avatar */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center shrink-0 text-white text-xs font-bold overflow-hidden">
          {getPhotoUrl(agent.photoUrl)
            ? <img src={getPhotoUrl(agent.photoUrl)!} alt="" className="w-full h-full object-cover" />
            : <>{agent.nom[0]}{agent.prenom[0]}</>
          }
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
            {agent.nom.toUpperCase()} {agent.prenom}
          </p>
          {agent.direction && (
            <p className="text-xs text-slate-400 truncate">{agent.direction.code}</p>
          )}
        </div>
      </div>

      {/* Poste */}
      <div className="min-w-0">
        {posteActuel ? (
          <p className="text-sm text-slate-700 truncate flex items-center gap-1">
            <MapPin size={11} className="text-slate-400 shrink-0" />
            {posteActuel.ville}, {posteActuel.pays}
          </p>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </div>

      {/* Statut */}
      <div className="w-20">
        <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full', s.bg, s.text)}>
          <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
          {AGENT_STATUS_LABELS[agent.status]}
        </span>
      </div>

      {/* Grade */}
      <div>
        <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
          {GRADE_ABBREV[agent.grade]}
        </span>
        <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[120px]">{AGENT_GRADE_LABELS[agent.grade]}</p>
      </div>

      {/* Fonction */}
      <div className="min-w-0">
        <p className="text-sm text-slate-700 truncate">{agent.fonction || agent.specialite || <span className="text-slate-400">—</span>}</p>
      </div>

      {/* Matricule */}
      <div className="w-28">
        <span className="font-mono text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">{agent.matricule}</span>
      </div>

      {/* Sexe */}
      <div className="w-10 text-center">
        <span className={cn(
          'text-xs font-bold px-2 py-0.5 rounded',
          agent.sexe === 'F' ? 'bg-pink-50 text-pink-600' : 'bg-blue-50 text-blue-600'
        )}>
          {agent.sexe ?? '—'}
        </span>
      </div>

      {/* Âge + actions */}
      <div className="w-12 flex items-center justify-between gap-1">
        <span className="text-xs text-slate-500 text-center">{age ?? '—'}</span>

        <div onClick={(e) => e.stopPropagation()}>
          {(canWrite || canDelete) && (
            <div className="relative">
              <button
                onClick={onMenuToggle}
                className="p-1 rounded text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
              >
                <MoreHorizontal size={15} />
              </button>
              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={onMenuToggle} />
                  <div className="absolute right-0 top-7 z-20 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 text-sm">
                    <MenuItem icon={<Eye size={14} />} onClick={onView}>Voir la fiche</MenuItem>
                    {canWrite && <MenuItem icon={<Pencil size={14} />} onClick={onEdit}>Modifier</MenuItem>}
                    {canWrite && (
                      <>
                        <div className="h-px bg-slate-100 my-1" />
                        <div className="px-3 py-1 text-xs text-slate-400 font-medium uppercase tracking-wide">Changer statut</div>
                        {(['EN_POSTE', 'EN_MISSION', 'EN_RAPPEL', 'EN_CONGE', 'SUSPENDU'] as AgentStatus[]).map((st) => (
                          st !== agent.status && (
                            <MenuItem key={st} icon={<span className={cn('w-2 h-2 rounded-full', STATUS_STYLE[st].dot)} />} onClick={() => onStatusChange(st)}>
                              {AGENT_STATUS_LABELS[st]}
                            </MenuItem>
                          )
                        ))}
                      </>
                    )}
                    {canDelete && (
                      <>
                        <div className="h-px bg-slate-100 my-1" />
                        <button onClick={onDelete} className="flex w-full items-center gap-2.5 px-3 py-2 text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 size={14} />Supprimer
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MenuItem({ icon, onClick, children }: { icon: React.ReactNode; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors">
      <span className="text-slate-400">{icon}</span>{children}
    </button>
  );
}
