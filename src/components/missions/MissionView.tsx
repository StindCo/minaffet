import { useState } from 'react';
import {
  MapPin,
  Calendar,
  Users,
  FileText,
  Crown,
  Upload,
  Download,
  Trash2,
  Clock,
  Globe2,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { useMission } from '../../hooks/useMissions';
import { MissionStatusBadge, MissionTypeBadge } from '../ui/StatusBadge';
import { AgentStatusBadge } from '../ui/StatusBadge';
import { DocumentUploadModal } from './DocumentUploadModal';
import { AddParticipantModal } from './AddParticipantModal';
import {
  formatDate,
  MISSION_ROLE_LABELS,
  AGENT_GRADE_LABELS,
  isChefDeMission,
  formatFileSize,
  cn,
  getPhotoUrl,
} from '../../lib/utils';
import type { MissionDocument, MissionParticipant } from '../../types';

interface MissionViewProps {
  missionId: string;
}

export function MissionView({ missionId }: MissionViewProps) {
  const { data, isLoading, error } = useMission(missionId);
  const [activeTab, setActiveTab] = useState<'composition' | 'documents' | 'details'>('composition');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);

  if (isLoading) return <MissionViewSkeleton />;
  if (error || !data?.data) return <div className="text-red-400 p-6">Erreur de chargement de la mission.</div>;

  const mission = data.data;

  const chef = mission.participants?.find((p) => isChefDeMission(p.role));
  const membres = mission.participants?.filter((p) => !isChefDeMission(p.role)) ?? [];

  const ordresDeMission = mission.documents?.filter((d) => d.type === 'ORDRE_DE_MISSION') ?? [];
  const rapports = mission.documents?.filter((d) =>
    ['RAPPORT_DE_MISSION', 'COMPTE_RENDU'].includes(d.type)
  ) ?? [];
  const autresDocuments = mission.documents?.filter((d) =>
    !['ORDRE_DE_MISSION', 'RAPPORT_DE_MISSION', 'COMPTE_RENDU'].includes(d.type)
  ) ?? [];

  const tabs = [
    { id: 'composition' as const, label: 'Composition', count: mission.participants?.length ?? 0, icon: Users },
    { id: 'documents' as const, label: 'Porte-documents', count: mission.documents?.length ?? 0, icon: FileText },
    { id: 'details' as const, label: 'Détails', count: null, icon: Globe2 },
  ];

  return (
    <div className="space-y-5">
      {/* En-tête de la mission */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Bande colorée supérieure */}
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600" />

        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  {mission.reference}
                </span>
                <MissionStatusBadge status={mission.status} />
                <MissionTypeBadge type={mission.type} />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 leading-snug">{mission.objet}</h2>
              {mission.description && (
                <p className="text-slate-500 text-sm mt-1.5 line-clamp-2">{mission.description}</p>
              )}
            </div>
          </div>

          {/* Méta-infos */}
          <div className="mt-5 flex flex-wrap gap-5 text-sm text-slate-600">
            <div className="flex items-center gap-1.5">
              <MapPin size={15} className="text-slate-400 shrink-0" />
              <span className="font-medium">
                {mission.ville}, {mission.pays}
              </span>
              {mission.codeIso && (
                <span className="text-base leading-none">
                  {getFlagEmoji(mission.codeIso)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={15} className="text-slate-400 shrink-0" />
              <span>
                {formatDate(mission.dateDebut)} — {formatDate(mission.dateFin)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={15} className="text-slate-400 shrink-0" />
              <span>{mission.dureeJours} jours</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users size={15} className="text-slate-400 shrink-0" />
              <span>{mission.participants?.length ?? 0} agents</span>
            </div>
            {mission.direction && (
              <div className="flex items-center gap-1.5">
                <Globe2 size={15} className="text-slate-400 shrink-0" />
                <span>{mission.direction.nom}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Barre d'onglets */}
        <div className="flex border-b border-slate-100">
          {tabs.map(({ id, label, count, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors',
                activeTab === id
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              )}
            >
              <Icon size={15} />
              {label}
              {count !== null && (
                <span
                  className={cn(
                    'ml-0.5 min-w-[20px] h-5 rounded-full px-1.5 text-xs inline-flex items-center justify-center',
                    activeTab === id ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Contenu des onglets */}
        <div className="p-6">
          {/* ── Onglet Composition ─────────────────────── */}
          {activeTab === 'composition' && (
            <div className="space-y-5">
              {/* Encart Chef de Mission */}
              {chef && chef.agent && (
                <div className="relative bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-5">
                  <div className="absolute top-3 right-3">
                    <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200">
                      <Crown size={12} className="text-amber-600" />
                      {MISSION_ROLE_LABELS[chef.role]}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <AgentAvatar
                      name={`${chef.agent.nom} ${chef.agent.prenom}`}
                      photoUrl={chef.agent.photoUrl}
                      size="lg"
                    />
                    <div>
                      <p className="font-semibold text-slate-900 text-base">
                        {chef.agent.prenom} {chef.agent.nom}
                      </p>
                      <p className="text-amber-700 text-sm font-medium">
                        {AGENT_GRADE_LABELS[chef.agent.grade]}
                      </p>
                      {chef.agent.specialite && (
                        <p className="text-slate-500 text-xs mt-0.5">{chef.agent.specialite}</p>
                      )}
                      {chef.agent.matricule && (
                        <p className="text-slate-400 text-xs mt-0.5 font-mono">{chef.agent.matricule}</p>
                      )}
                    </div>
                  </div>
                  {chef.notes && (
                    <p className="mt-3 text-xs text-amber-800 bg-amber-100/50 px-3 py-2 rounded-lg">
                      {chef.notes}
                    </p>
                  )}
                </div>
              )}

              {/* Liste des membres */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Users size={15} className="text-slate-400" />
                    Membres de la délégation
                    <span className="text-xs text-slate-400 font-normal">({membres.length})</span>
                  </h3>
                  <button
                    onClick={() => setShowAddParticipantModal(true)}
                    className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Plus size={13} />
                    Ajouter un membre
                  </button>
                </div>

                {membres.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Aucun membre ajouté à cette mission.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {membres.map((participant) => (
                      <ParticipantRow key={participant.id} participant={participant} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Onglet Porte-documents ───────────────── */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              {/* Section : Ordres de mission */}
              <DocumentSection
                title="Ordres de Mission"
                icon="📋"
                documents={ordresDeMission}
                emptyText="Aucun ordre de mission déposé"
                highlightColor="bg-blue-50 border-blue-200"
              />

              {/* Section : Rapports */}
              <DocumentSection
                title="Rapports de mission"
                icon="📄"
                documents={rapports}
                emptyText="Aucun rapport déposé"
                highlightColor="bg-emerald-50 border-emerald-200"
              />

              {/* Section : Autres */}
              {autresDocuments.length > 0 && (
                <DocumentSection
                  title="Autres documents"
                  icon="📁"
                  documents={autresDocuments}
                  emptyText=""
                  highlightColor="bg-slate-50 border-slate-200"
                />
              )}

              {/* Bouton d'upload */}
              <button
                onClick={() => setShowUploadModal(true)}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-300 rounded-xl text-sm font-medium text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all"
              >
                <Upload size={16} />
                Déposer un document
              </button>
            </div>
          )}

          {/* ── Onglet Détails ────────────────────────── */}
          {activeTab === 'details' && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <DetailItem label="Référence" value={mission.reference} />
              <DetailItem label="Type" value={mission.type} />
              <DetailItem label="Statut" value={mission.status} />
              <DetailItem label="Pays" value={`${mission.ville}, ${mission.pays}`} />
              <DetailItem label="Date de début" value={formatDate(mission.dateDebut)} />
              <DetailItem label="Date de fin" value={formatDate(mission.dateFin)} />
              <DetailItem label="Durée" value={`${mission.dureeJours} jours`} />
              <DetailItem label="Direction" value={mission.direction?.nom ?? '—'} />
              {mission.latitude && mission.longitude && (
                <DetailItem
                  label="Coordonnées"
                  value={`${mission.latitude.toFixed(4)}, ${mission.longitude.toFixed(4)}`}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      {showUploadModal && (
        <DocumentUploadModal
          missionId={missionId}
          onClose={() => setShowUploadModal(false)}
        />
      )}
      {showAddParticipantModal && (
        <AddParticipantModal
          mission={mission}
          onClose={() => setShowAddParticipantModal(false)}
        />
      )}
    </div>
  );
}

// ── Sous-composants ────────────────────────────────────────────

function AgentAvatar({ name, photoUrl, size = 'md' }: { name: string; photoUrl?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  const sizeClass = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base' }[size];
  const src = getPhotoUrl(photoUrl);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover shrink-0 ring-2 ring-white', sizeClass)}
      />
    );
  }

  return (
    <div className={cn('rounded-full bg-slate-700 text-white font-semibold flex items-center justify-center shrink-0 ring-2 ring-white', sizeClass)}>
      {initials}
    </div>
  );
}

function ParticipantRow({ participant }: { participant: MissionParticipant }) {
  const agent = participant.agent;
  if (!agent) return null;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group cursor-pointer">
      <AgentAvatar name={`${agent.nom} ${agent.prenom}`} photoUrl={agent.photoUrl} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-slate-900 text-sm">
            {agent.prenom} {agent.nom}
          </p>
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {MISSION_ROLE_LABELS[participant.role]}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          {AGENT_GRADE_LABELS[agent.grade]}
          {agent.specialite && <> · {agent.specialite}</>}
        </p>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {participant.confirme ? (
          <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Confirmé</span>
        ) : (
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Non confirmé</span>
        )}
        <ChevronRight size={14} className="text-slate-400" />
      </div>
    </div>
  );
}

function DocumentSection({
  title,
  icon,
  documents,
  emptyText,
  highlightColor,
}: {
  title: string;
  icon: string;
  documents: MissionDocument[];
  emptyText: string;
  highlightColor: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
        <span>{icon}</span> {title}
        <span className="text-xs font-normal text-slate-400">({documents.length})</span>
      </h3>
      {documents.length === 0 ? (
        emptyText && (
          <div className={cn('border rounded-xl px-4 py-3 text-sm text-slate-500', highlightColor)}>
            {emptyText}
          </div>
        )
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <DocumentRow key={doc.id} document={doc} />
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentRow({ document: doc }: { document: MissionDocument }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all group">
      <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
        <FileText size={15} className="text-red-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{doc.titre}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {formatFileSize(doc.fileSize)} · Déposé le {formatDate(doc.createdAt)}
          {doc.deposePar && <> par {doc.deposePar}</>}
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <a
          href={`${import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:3001'}${doc.fileUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="p-2 rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          title="Télécharger"
        >
          <Download size={15} />
        </a>
        <button
          className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          title="Supprimer"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function MissionViewSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="bg-white rounded-xl border border-slate-200 p-6 h-36" />
      <div className="bg-white rounded-xl border border-slate-200 p-6 h-80" />
    </div>
  );
}

function getFlagEmoji(codeIso: string): string {
  const offset = 127397;
  return [...codeIso.toUpperCase()].map((c) => String.fromCodePoint(c.charCodeAt(0) + offset)).join('');
}
