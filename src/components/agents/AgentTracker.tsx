import { useState } from 'react';
import { Search, MapPin, Plane, UserCheck, Clock, Crown } from 'lucide-react';
import { useAgents } from '../../hooks/useAgents';
import { useTrackAgent } from '../../hooks/useAgents';
import { AgentStatusBadge } from '../ui/StatusBadge';
import { MissionTypeBadge } from '../ui/StatusBadge';
import {
  formatDate,
  MISSION_ROLE_LABELS,
  AGENT_GRADE_LABELS,
  isChefDeMission,
} from '../../lib/utils';
import type { Agent } from '../../types';

export function AgentTracker() {
  const [search, setSearch] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data: searchResults } = useAgents({
    search: search && search.length >= 2 ? search : undefined,
    limit: 8,
  });

  const { data: trackData, isLoading: isTracking } = useTrackAgent(selectedAgent?.id ?? '');

  const handleSelect = (agent: Agent) => {
    setSelectedAgent(agent);
    setSearch(`${agent.prenom} ${agent.nom}`);
    setShowSuggestions(false);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setShowSuggestions(true);
    if (!val) setSelectedAgent(null);
  };

  const track = trackData?.data;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Barre de recherche principale */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Search size={18} className="text-blue-500" />
            Agent Tracker
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Localisez instantanément un agent diplomatique</p>
        </div>

        <div className="p-5 relative">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Nom, prénom ou matricule de l'agent..."
              className="w-full pl-11 pr-4 py-3 text-sm border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors bg-slate-50"
            />
          </div>

          {/* Suggestions */}
          {showSuggestions && search.length >= 2 && searchResults?.data && searchResults.data.length > 0 && !selectedAgent && (
            <div className="absolute left-5 right-5 top-[calc(100%-0.5rem)] z-10 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
              {searchResults.data.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onMouseDown={() => handleSelect(agent)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left border-b border-slate-50 last:border-0 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">{agent.nom[0]}{agent.prenom[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{agent.prenom} {agent.nom}</p>
                    <p className="text-xs text-slate-500">{AGENT_GRADE_LABELS[agent.grade]} · {agent.matricule}</p>
                  </div>
                  <AgentStatusBadge status={agent.status} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Résultat du tracking */}
      {isTracking && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center animate-pulse">
          <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto mb-3" />
          <div className="h-4 bg-slate-100 rounded w-48 mx-auto mb-2" />
          <div className="h-3 bg-slate-100 rounded w-32 mx-auto" />
        </div>
      )}

      {track && !isTracking && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Résumé agent */}
          <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-100">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shrink-0 ring-2 ring-white shadow-md">
              <span className="text-white text-lg font-bold">
                {track.agent.nom[0]}{track.agent.prenom[0]}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-slate-900">
                {track.agent.prenom} {track.agent.nom}
              </h3>
              <p className="text-sm text-slate-500">{AGENT_GRADE_LABELS[track.agent.grade]}</p>
              <p className="text-xs text-slate-400 font-mono">{track.agent.matricule}</p>
            </div>
            <AgentStatusBadge status={track.agent.status} />
          </div>

          {/* Localisation */}
          <div className="px-6 py-5">
            {track.localisation.enMission ? (
              <div className="space-y-4">
                {/* Encart "En mission" */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Plane size={16} className="text-blue-500" />
                    <span className="text-sm font-semibold text-blue-800">Actuellement en mission</span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <MapPin size={14} className="text-blue-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {track.localisation.mission.ville}, {track.localisation.mission.pays}
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5">{track.localisation.mission.objet}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Clock size={14} className="text-blue-400 shrink-0" />
                      <p className="text-xs text-slate-600">
                        Retour prévu le{' '}
                        <span className="font-semibold text-slate-800">
                          {formatDate(track.localisation.mission.dateFin)}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <UserCheck size={14} className="text-blue-400 shrink-0" />
                      <p className="text-xs text-slate-600">
                        Rôle :{' '}
                        <span className={`font-semibold ${isChefDeMission(track.localisation.role) ? 'text-amber-700' : 'text-slate-800'}`}>
                          {MISSION_ROLE_LABELS[track.localisation.role]}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <MissionTypeBadge type={track.localisation.mission.type} />
                    </div>
                  </div>
                </div>

                {/* Chef de mission */}
                {track.localisation.chefDeMission && !isChefDeMission(track.localisation.role) && (
                  <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <Crown size={15} className="text-amber-500 shrink-0" />
                    <div>
                      <p className="text-xs text-amber-700">Sous la direction de</p>
                      <p className="text-sm font-semibold text-amber-900">
                        {track.localisation.chefDeMission.prenom}{' '}{track.localisation.chefDeMission.nom}
                      </p>
                      <p className="text-xs text-amber-700">
                        {AGENT_GRADE_LABELS[track.localisation.chefDeMission.grade]}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <UserCheck size={18} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-800">En poste — non en mission</p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Cet agent ne figure dans aucune mission en cours à ce jour.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
