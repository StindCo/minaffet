import { useState } from 'react';
import { X, Search, UserPlus, CheckCircle2, AlertCircle, Crown, Star } from 'lucide-react';
import { useAgents } from '../../hooks/useAgents';
import { useAddParticipant } from '../../hooks/useMissions';
import { AGENT_GRADE_LABELS, MISSION_ROLE_LABELS, AGENT_STATUS_LABELS, cn, getPhotoUrl } from '../../lib/utils';
import type { Mission, MissionParticipant, MissionRole, AgentStatus, Agent } from '../../types';

const STATUS_DOT: Record<AgentStatus, string> = {
  EN_POSTE: 'bg-emerald-400', EN_MISSION: 'bg-blue-400', EN_RAPPEL: 'bg-amber-400',
  EN_CONGE: 'bg-slate-300', SUSPENDU: 'bg-red-400',
};

const ROLES: { value: MissionRole; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'CHEF_DE_MISSION',    label: 'Chef de Mission',    icon: <Crown size={13} />,  desc: '1 seul autorisé par mission' },
  { value: 'CHEF_DE_DELEGATION', label: 'Chef de Délégation', icon: <Crown size={13} />,  desc: '1 seul autorisé par mission' },
  { value: 'EXPERT',             label: 'Expert',             icon: <Star size={13} />,   desc: 'Expertise technique' },
  { value: 'RAPPORTEUR',         label: 'Rapporteur',         icon: null,                 desc: 'Rédaction des rapports' },
  { value: 'CONSEILLER_TECHNIQUE', label: 'Conseiller Technique', icon: null,             desc: '' },
  { value: 'ATTACHE_DE_PRESSE',  label: 'Attaché de Presse',  icon: null,                 desc: '' },
  { value: 'PROTOCOLE',          label: 'Protocole',          icon: null,                 desc: '' },
  { value: 'OBSERVATEUR',        label: 'Observateur',        icon: null,                 desc: '' },
  { value: 'MEMBRE',             label: 'Membre',             icon: null,                 desc: '' },
];

interface Props {
  mission: Mission;
  onClose: () => void;
}

export function AddParticipantModal({ mission, onClose }: Props) {
  const [search, setSearch] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [role, setRole] = useState<MissionRole>('MEMBRE');
  const [notes, setNotes] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { data } = useAgents({ search: search || undefined, limit: 8 });
  const addParticipant = useAddParticipant();

  const agents = data?.data ?? [];

  // Agents déjà dans la mission
  const existingIds = new Set(mission.participants?.map((p: MissionParticipant) => p.agentId) ?? []);
  const availableAgents = agents.filter((a) => !existingIds.has(a.id));

  // Vérifier si un chef est déjà présent
  const chefExistant = mission.participants?.find(
    (p: MissionParticipant) => p.role === 'CHEF_DE_MISSION' || p.role === 'CHEF_DE_DELEGATION'
  );

  const handleSubmit = async () => {
    if (!selectedAgent) return;
    setError('');
    try {
      await addParticipant.mutateAsync({
        missionId: mission.id,
        agentId: selectedAgent.id,
        role,
        notes: notes.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        // Permettre d'en ajouter un autre
        setSelectedAgent(null);
        setRole('MEMBRE');
        setNotes('');
        setSearch('');
        setSuccess(false);
      }, 1000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message ?? 'Erreur lors de l\'ajout');
    }
  };

  const isChefRole = role === 'CHEF_DE_MISSION' || role === 'CHEF_DE_DELEGATION';
  const chefConflict = isChefRole && !!chefExistant;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">

        {/* En-tête */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <UserPlus size={16} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Ajouter un participant</h2>
              <p className="text-xs text-slate-500 truncate max-w-[260px]">{mission.objet}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 transition-colors rounded">
            <X size={17} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* ── Recherche agent ──────────────────────── */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Sélectionner un agent <span className="text-red-500">*</span>
            </label>
            <div className="relative mb-2">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSelectedAgent(null); }}
                placeholder="Rechercher par nom, matricule..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Résultats */}
            {search && (
              <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 max-h-52 overflow-y-auto">
                {availableAgents.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-slate-500 text-center">
                    {agents.length === 0 ? 'Aucun agent trouvé' : 'Tous les agents correspondants sont déjà dans la mission'}
                  </div>
                ) : (
                  availableAgents.map((agent) => (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => { setSelectedAgent(agent); setSearch(''); }}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left',
                        selectedAgent?.id === agent.id && 'bg-blue-50'
                      )}
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {getPhotoUrl(agent.photoUrl)
                          ? <img src={getPhotoUrl(agent.photoUrl)!} alt="" className="w-full h-full rounded-full object-cover" />
                          : <>{agent.nom[0]}{agent.prenom[0]}</>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{agent.prenom} {agent.nom}</p>
                        <p className="text-xs text-slate-500 truncate">{AGENT_GRADE_LABELS[agent.grade]} · {agent.matricule}</p>
                      </div>
                      <span className={cn('w-2 h-2 rounded-full flex-shrink-0', STATUS_DOT[agent.status])} />
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Agent sélectionné */}
            {selectedAgent && (
              <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {getPhotoUrl(selectedAgent.photoUrl)
                    ? <img src={getPhotoUrl(selectedAgent.photoUrl)!} alt="" className="w-full h-full rounded-full object-cover" />
                    : <>{selectedAgent.nom[0]}{selectedAgent.prenom[0]}</>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-blue-900">{selectedAgent.prenom} {selectedAgent.nom}</p>
                  <p className="text-xs text-blue-700">{AGENT_GRADE_LABELS[selectedAgent.grade]} · {AGENT_STATUS_LABELS[selectedAgent.status]}</p>
                </div>
                <button onClick={() => setSelectedAgent(null)} className="text-blue-400 hover:text-blue-700 transition-colors">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* ── Rôle ─────────────────────────────────── */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Rôle dans la mission <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {ROLES.map(({ value, label, icon }) => {
                const isSelected = role === value;
                const isUniqueRole = value === 'CHEF_DE_MISSION' || value === 'CHEF_DE_DELEGATION';
                const isDisabled = isUniqueRole && !!chefExistant && chefExistant.role !== value;
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => setRole(value)}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-semibold transition-all text-left',
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                      isDisabled && 'opacity-40 cursor-not-allowed'
                    )}
                  >
                    {icon && <span>{icon}</span>}
                    {label}
                  </button>
                );
              })}
            </div>
            {chefConflict && (
              <p className="flex items-center gap-1.5 text-xs text-amber-600 mt-2 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                <AlertCircle size={12} />
                Un chef est déjà désigné dans cette mission. Retirez-le d'abord ou choisissez un autre rôle.
              </p>
            )}
          </div>

          {/* ── Notes ────────────────────────────────── */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Notes (optionnel)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instructions particulières pour ce participant..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Erreur / Succès */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2.5 rounded-lg">
              <AlertCircle size={14} />{error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-lg">
              <CheckCircle2 size={14} />Participant ajouté avec succès !
            </div>
          )}
        </div>

        {/* ── Actions ──────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-t border-slate-200">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors">
            Fermer
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedAgent || chefConflict || addParticipant.isPending}
            className={cn(
              'flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all',
              (!selectedAgent || chefConflict || addParticipant.isPending) ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
            )}
            style={{ backgroundColor: '#007FFF' }}
          >
            {addParticipant.isPending
              ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Ajout...</>
              : <><UserPlus size={14} />Ajouter</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
