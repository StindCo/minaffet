import { useNavigate } from 'react-router-dom';
import type { AgentExterne } from '../../types';
import { cn, getPhotoUrl, AGENT_GRADE_LABELS } from '../../lib/utils';
import { StatutMutationBadge } from './StatutMutationBadge';
import { Globe2, MapPin } from 'lucide-react';

function countryFlag(codeIso2?: string | null): string {
  if (!codeIso2 || codeIso2.length !== 2) return '🌐';
  const codePoints = [...codeIso2.toUpperCase()].map(
    (c) => 0x1F1E6 + c.charCodeAt(0) - 65
  );
  return String.fromCodePoint(...codePoints);
}

interface Props {
  agents: AgentExterne[];
}

export function AgentTilesView({ agents }: Props) {
  const navigate = useNavigate();

  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <Globe2 size={48} className="mb-4 opacity-20" />
        <p className="text-sm font-medium">Aucun membre du personnel trouvé</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-5">
      {agents.map((agent) => {
        const mutation = agent.mutations?.[0];
        const photo = getPhotoUrl(agent.photoUrl);

        return (
          <button
            key={agent.id}
            onClick={() => navigate(`/externes/agents/${agent.id}`)}
            className="group relative bg-white border border-slate-100 rounded-2xl p-5 text-left hover:border-rdc-blue/30 hover:shadow-lg hover:shadow-rdc-blue/5 transition-all duration-200"
          >
            {/* Accent selon type */}
            <div className={cn(
              'absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl',
              agent.typeAgent === 'DIPLOMATE'
                ? 'bg-gradient-to-r from-rdc-blue to-rdc-blue-dark'
                : 'bg-gradient-to-r from-violet-500 to-violet-400'
            )} />

            {/* Photo + badge mutation */}
            <div className="flex items-start gap-3 mb-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                  {photo
                    ? <img src={photo} alt="" className="w-full h-full object-cover" />
                    : <span className="text-slate-400 font-bold text-sm">{agent.nom[0]}{agent.prenom[0]}</span>
                  }
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 text-sm leading-tight truncate group-hover:text-rdc-blue transition-colors">
                  {agent.prenom} {agent.nom}
                </p>
                <p className="text-slate-400 text-xs mt-0.5">{agent.matricule}</p>
                <span className={cn(
                  'inline-flex items-center mt-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold',
                  agent.typeAgent === 'DIPLOMATE'
                    ? 'bg-rdc-blue/10 text-rdc-blue'
                    : 'bg-violet-50 text-violet-700'
                )}>
                  {agent.typeAgent === 'DIPLOMATE' ? 'Diplomate' : 'Hors cadre'}
                </span>
              </div>
            </div>

            {/* Grade */}
            <p className="text-xs text-slate-500 font-medium mb-2 truncate">{AGENT_GRADE_LABELS[agent.grade]}</p>

            {/* Pays affectation */}
            <div className="flex items-center gap-1.5 mb-3">
              {agent.paysActuel ? (
                <>
                  <span className="text-sm">{countryFlag(agent.paysActuel.codeIso2)}</span>
                  <span className="text-slate-700 text-xs font-semibold truncate">{agent.paysActuel.nom}</span>
                  {agent.paysActuel.region && (
                    <span className="text-slate-300 text-xs">· {agent.paysActuel.region.code}</span>
                  )}
                </>
              ) : (
                <span className="flex items-center gap-1 text-slate-300 text-xs">
                  <MapPin size={10} /> Non affecté
                </span>
              )}
            </div>

            {/* Statut mutation */}
            {mutation && (
              <div className="flex items-center justify-between">
                <StatutMutationBadge statut={mutation.statut} size="sm" />
                <span className="text-slate-300 text-[10px]">
                  {new Date(mutation.dateFin).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
