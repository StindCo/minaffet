import { useNavigate } from 'react-router-dom';
import { MoreVertical, Eye, Pencil, Trash2, Globe2 } from 'lucide-react';
import { useState } from 'react';
import type { AgentExterne } from '../../types';
import { cn, getPhotoUrl, AGENT_GRADE_LABELS } from '../../lib/utils';
import { StatutMutationBadge } from './StatutMutationBadge';
import { useAuthStore } from '../../store/authStore';
import { useDeleteAgentExterne } from '../../hooks/useAgentsExternes';

function countryFlag(codeIso2?: string | null): string {
  if (!codeIso2 || codeIso2.length !== 2) return '🌐';
  const codePoints = [...codeIso2.toUpperCase()].map(
    (c) => 0x1F1E6 + c.charCodeAt(0) - 65
  );
  return String.fromCodePoint(...codePoints);
}

interface Props {
  agents: AgentExterne[];
  onEdit: (agent: AgentExterne) => void;
}

export function AgentTableView({ agents, onEdit }: Props) {
  const navigate = useNavigate();
  const { canWrite, canDelete } = useAuthStore();
  const deleteAgent = useDeleteAgentExterne();
  const [menuId, setMenuId] = useState<string | null>(null);

  function handleDelete(agent: AgentExterne) {
    if (!window.confirm(`Supprimer ${agent.prenom} ${agent.nom} ? Cette action est irréversible.`)) return;
    deleteAgent.mutate(agent.id);
    setMenuId(null);
  }

  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <Globe2 size={48} className="mb-4 opacity-20" />
        <p className="text-sm font-medium">Aucun membre du personnel trouvé</p>
        <p className="text-xs mt-1">Modifiez vos filtres ou ajoutez du personnel.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Personnel</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Type</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Grade</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Pays d'affectation</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Mutation</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Région</th>
            <th className="py-3 px-4" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {agents.map((agent) => {
            const mutation = agent.mutations?.[0];
            const photo = getPhotoUrl(agent.photoUrl);

            return (
              <tr key={agent.id} className="hover:bg-slate-50/70 group transition-colors">
                {/* Agent */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                      {photo
                        ? <img src={photo} alt="" className="w-full h-full object-cover" />
                        : <span className="text-slate-400 font-bold text-xs">{agent.nom[0]}{agent.prenom[0]}</span>
                      }
                    </div>
                    <div>
                      <button
                        onClick={() => navigate(`/externes/agents/${agent.id}`)}
                        className="font-semibold text-slate-800 hover:text-rdc-blue transition-colors text-left"
                      >
                        {agent.prenom} {agent.nom}
                      </button>
                      <p className="text-xs text-slate-400">{agent.matricule}</p>
                    </div>
                  </div>
                </td>

                {/* Type */}
                <td className="py-3 px-4">
                  <span className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border',
                    agent.typeAgent === 'DIPLOMATE'
                      ? 'bg-rdc-blue/10 text-rdc-blue border-rdc-blue/20'
                      : 'bg-violet-50 text-violet-700 border-violet-200'
                  )}>
                    {agent.typeAgent === 'DIPLOMATE' ? 'Diplomate' : 'Hors cadre'}
                  </span>
                </td>

                {/* Grade */}
                <td className="py-3 px-4">
                  <span className="text-slate-600 text-xs">{AGENT_GRADE_LABELS[agent.grade]}</span>
                </td>

                {/* Pays */}
                <td className="py-3 px-4">
                  {agent.paysActuel ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{countryFlag(agent.paysActuel.codeIso2)}</span>
                      <span className="text-slate-700 text-sm font-medium">{agent.paysActuel.nom}</span>
                    </div>
                  ) : (
                    <span className="text-slate-300 text-xs italic">Non affecté</span>
                  )}
                </td>

                {/* Statut mutation */}
                <td className="py-3 px-4">
                  {mutation
                    ? <StatutMutationBadge statut={mutation.statut} size="sm" />
                    : <span className="text-slate-300 text-xs">—</span>
                  }
                </td>

                {/* Région */}
                <td className="py-3 px-4">
                  <span className="text-slate-500 text-xs">{agent.paysActuel?.region?.nom ?? '—'}</span>
                </td>

                {/* Actions */}
                <td className="py-3 px-4">
                  <div className="relative flex justify-end">
                    <button
                      onClick={() => setMenuId(menuId === agent.id ? null : agent.id)}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <MoreVertical size={14} />
                    </button>

                    {menuId === agent.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuId(null)} />
                        <div className="absolute right-0 top-full mt-1 z-20 w-44 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                          <button
                            onClick={() => { navigate(`/externes/agents/${agent.id}`); setMenuId(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                          >
                            <Eye size={13} className="text-slate-400" /> Voir la fiche
                          </button>
                          {canWrite() && (
                            <button
                              onClick={() => { onEdit(agent); setMenuId(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                              <Pencil size={13} className="text-slate-400" /> Modifier
                            </button>
                          )}
                          {canDelete() && (
                            <button
                              onClick={() => handleDelete(agent)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rdc-red hover:bg-rdc-red/5 transition-colors border-t border-slate-100"
                            >
                              <Trash2 size={13} /> Supprimer
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
