import { Link } from 'react-router-dom';
import { X, MapPin, Calendar, Users, FileText, ExternalLink } from 'lucide-react';
import { useMission } from '../../hooks/useMissions';
import { MissionStatusBadge, MissionTypeBadge } from '../ui/StatusBadge';
import {
  formatDate,
  cn,
  getPhotoUrl,
  MISSION_ROLE_LABELS,
  AGENT_GRADE_LABELS,
  DOCUMENT_TYPE_LABELS,
} from '../../lib/utils';

interface Props {
  missionId: string | null;
  onClose: () => void;
}

export function MissionQuickViewModal({ missionId, onClose }: Props) {
  const { data, isLoading, error } = useMission(missionId ?? '');

  if (!missionId) return null;

  const mission = data?.data;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mission-quick-title"
        className={cn(
          'relative w-full max-w-lg max-h-[min(90vh,640px)] overflow-hidden flex flex-col',
          'rounded-2xl border-2 border-slate-200 bg-white shadow-2xl shadow-slate-900/15'
        )}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Aperçu mission</p>
            <h2 id="mission-quick-title" className="text-base font-bold text-slate-900 truncate mt-0.5">
              {isLoading ? 'Chargement…' : mission?.objet ?? 'Mission'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:bg-white hover:text-slate-800 border border-transparent hover:border-slate-200 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {isLoading && (
            <div className="space-y-3 animate-pulse">
              <div className="h-6 bg-slate-100 rounded w-2/3" />
              <div className="h-4 bg-slate-100 rounded w-full" />
              <div className="h-4 bg-slate-100 rounded w-4/5" />
            </div>
          )}
          {error && <p className="text-sm text-red-600">Impossible de charger cette mission.</p>}
          {!isLoading && mission && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {mission.reference}
                </span>
                <MissionStatusBadge status={mission.status} />
                <MissionTypeBadge type={mission.type} />
              </div>

              <div className="grid gap-2 text-sm text-slate-700">
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    {mission.ville}, {mission.pays}
                    {mission.codeIso && <span className="text-slate-400"> ({mission.codeIso})</span>}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    {formatDate(mission.dateDebut)} → {formatDate(mission.dateFin)}
                    {mission.dureeJours != null && (
                      <span className="text-slate-500"> · {mission.dureeJours} jour{mission.dureeJours !== 1 ? 's' : ''}</span>
                    )}
                  </span>
                </div>
                {mission.direction && (
                  <p className="text-xs text-slate-500 pl-7">
                    Direction : <span className="font-medium text-slate-700">{mission.direction.code}</span> — {mission.direction.nom}
                  </p>
                )}
              </div>

              {mission.description && (
                <p className="text-sm text-slate-600 leading-relaxed border-l-4 border-blue-400 pl-3 py-0.5 bg-blue-50/50 rounded-r">
                  {mission.description}
                </p>
              )}

              <div className="flex flex-wrap gap-4 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Users size={14} className="text-slate-400" />
                  {mission.participants?.length ?? mission._count?.participants ?? 0} participant
                  {(mission.participants?.length ?? mission._count?.participants ?? 0) !== 1 ? 's' : ''}
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <FileText size={14} className="text-slate-400" />
                  {mission.documents?.length ?? mission._count?.documents ?? 0} document
                  {(mission.documents?.length ?? mission._count?.documents ?? 0) !== 1 ? 's' : ''}
                </span>
              </div>

              {(mission.participants?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Équipe</p>
                  <ul className="space-y-2">
                    {mission.participants!.slice(0, 6).map((p) => (
                      <li key={p.id} className="flex items-center gap-2 text-sm">
                        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-[10px] font-bold text-slate-600">
                          {p.agent?.photoUrl
                            ? <img src={getPhotoUrl(p.agent.photoUrl)!} alt="" className="w-full h-full object-cover" />
                            : <>{p.agent?.nom?.[0]}{p.agent?.prenom?.[0]}</>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-800 truncate">
                            {p.agent?.prenom} {p.agent?.nom}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {p.agent && AGENT_GRADE_LABELS[p.agent.grade]} · {MISSION_ROLE_LABELS[p.role]}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {(mission.participants!.length > 6) && (
                    <p className="text-xs text-slate-400 mt-2">+{mission.participants!.length - 6} autre(s) sur la fiche complète</p>
                  )}
                </div>
              )}

              {(mission.documents?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Documents récents</p>
                  <ul className="space-y-1.5">
                    {mission.documents!.slice(0, 5).map((d) => (
                      <li key={d.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-slate-700 truncate">{d.titre}</span>
                        <span className="text-[10px] uppercase shrink-0 text-slate-400 font-medium">
                          {DOCUMENT_TYPE_LABELS[d.type]}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {!isLoading && mission && (
          <div className="flex flex-wrap gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50/90">
            <Link
              to={`/missions/${mission.id}`}
              onClick={onClose}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition hover:opacity-90"
              style={{ backgroundColor: '#007FFF' }}
            >
              <ExternalLink size={15} />
              Ouvrir la fiche complète
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-600 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
            >
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
