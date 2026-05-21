import { useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Pencil, MapPin, Calendar, FileText, Briefcase,
  Phone, Mail, Award, Globe, Activity, Camera,
} from 'lucide-react';
import { useAgent, useUploadAgentPhoto } from '../hooks/useAgents';
import { compressImage } from '../lib/imageUtils';
import { useAuthStore } from '../store/authStore';

import { AgentFormModal } from '../components/agents/AgentFormModal';
import {
  AGENT_GRADE_LABELS, AGENT_STATUS_LABELS,
  MISSION_TYPE_LABELS, MISSION_STATUS_LABELS, MISSION_ROLE_LABELS,
  formatDate, cn, getPhotoUrl,
} from '../lib/utils';
import type { AgentStatus, MissionStatus, MissionRole } from '../types';

// ── Couleurs ──────────────────────────────────────────────
const STATUS_STYLE: Record<AgentStatus, { dot: string; bg: string; text: string }> = {
  EN_POSTE:   { dot: 'bg-emerald-400', bg: 'bg-emerald-50',  text: 'text-emerald-700' },
  EN_MISSION: { dot: 'bg-blue-400',    bg: 'bg-blue-50',     text: 'text-blue-700'    },
  EN_RAPPEL:  { dot: 'bg-amber-400',   bg: 'bg-amber-50',    text: 'text-amber-700'   },
  EN_CONGE:   { dot: 'bg-slate-300',   bg: 'bg-slate-100',   text: 'text-slate-500'   },
  SUSPENDU:   { dot: 'bg-red-400',     bg: 'bg-red-50',      text: 'text-red-700'     },
};

const MISSION_STATUS_DOT: Record<MissionStatus, string> = {
  PLANIFIEE: 'bg-slate-400', EN_COURS: 'bg-emerald-400', TERMINEE: 'bg-blue-400',
  SUSPENDUE: 'bg-amber-400', ANNULEE: 'bg-red-400',
};

const ROLE_STYLE: Record<any, string> = {
  CHEF_DE_MISSION:     'bg-amber-50 text-amber-700 border-amber-200',
  CHEF_DE_DELEGATION:  'bg-amber-50 text-amber-700 border-amber-200',
  EXPERT:              'bg-blue-50 text-blue-700 border-blue-200',
  RAPPORTEUR:          'bg-violet-50 text-violet-700 border-violet-200',
  ATTACHE_DE_PRESSE:   'bg-sky-50 text-sky-700 border-sky-200',
  PROTOCOLE:           'bg-teal-50 text-teal-700 border-teal-200',
  CONSEILLER_TECHNIQUE:'bg-indigo-50 text-indigo-700 border-indigo-200',
  OBSERVATEUR:         'bg-slate-100 text-slate-600 border-slate-200',
  MEMBRE:              'bg-slate-100 text-slate-600 border-slate-200',
};

function calcAge(dn?: string) {
  if (!dn) return null;
  return Math.floor((Date.now() - new Date(dn).getTime()) / (365.25 * 24 * 3600 * 1000));
}

// ── Page ──────────────────────────────────────────────────
export function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canWrite } = useAuthStore();
  const { data, isLoading } = useAgent(id!);
  const [editOpen, setEditOpen] = useState(false);
  const [tab, setTab] = useState<'profil' | 'missions' | 'postes'>('profil');
  const photoInputRef = useRef<HTMLInputElement>(null);
  const uploadPhoto = useUploadAgentPhoto();

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-40 bg-slate-200 rounded-xl animate-pulse" />
        <div className="h-96 bg-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-slate-600 font-semibold">Agent introuvable</p>
        <Link to="/agents" className="mt-3 text-sm text-blue-600 hover:underline">← Retour à la liste</Link>
      </div>
    );
  }

  const agent = data.data;
  const s = STATUS_STYLE[agent.status];
  const age = calcAge(agent.dateNaissance);
  const missionsTerminees = agent.participations?.filter((p:any) => p.mission?.status === 'TERMINEE').length ?? 0;
  const missionsActives = agent.participations?.filter((p:any) => p.mission?.status === 'EN_COURS').length ?? 0;

  return (
    <div className="space-y-5">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/agents" className="hover:text-slate-800 flex items-center gap-1 transition-colors">
          <ChevronLeft size={15} />Agents
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-700 font-medium">{agent.prenom} {agent.nom}</span>
      </div>

      {/* ── Carte profil ──────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Bandeau haut */}
        <div className="h-20 w-full" style={{ background: 'linear-gradient(135deg, #0D2B6E 0%, #007FFF 100%)' }} />

        <div className="px-6 pb-5">
          <div className="flex items-end justify-between -mt-10 mb-4">
            {/* Avatar cliquable pour changer la photo */}
            <div
              onClick={() => canWrite() && photoInputRef.current?.click()}
              className={cn(
                'relative w-20 h-20 rounded-xl border-4 border-white bg-slate-700 flex items-center justify-center shadow-md shrink-0',
                canWrite() && 'cursor-pointer group'
              )}
              title={canWrite() ? 'Cliquer pour changer la photo' : undefined}
            >
              {getPhotoUrl(agent.photoUrl)
                ? <img src={getPhotoUrl(agent.photoUrl)!} alt="" className="w-full h-full rounded-lg object-cover" />
                : <span className="text-white text-2xl font-bold">{agent.nom[0]}{agent.prenom[0]}</span>
              }
              {canWrite() && (
                <div className="absolute inset-0 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {uploadPhoto.isPending
                    ? <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    : <Camera size={20} className="text-white" />
                  }
                </div>
              )}
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !id) return;
                try {
                  const compressed = await compressImage(file);
                  await uploadPhoto.mutateAsync({ id, file: compressed });
                } catch {
                  await uploadPhoto.mutateAsync({ id, file });
                }
              }}
            />

            {/* Actions */}
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full', s.bg, s.text)}>
                <span className={cn('w-2 h-2 rounded-full', s.dot)} />
                {AGENT_STATUS_LABELS[agent.status]}
              </span>
              {canWrite() && (
                <button
                  onClick={() => setEditOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Pencil size={12} />Modifier
                </button>
              )}
            </div>
          </div>

          {/* Infos principales */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">{agent.prenom} {agent.nom}</h1>
              <p className="text-base text-slate-600 font-medium mt-0.5">
                {AGENT_GRADE_LABELS[agent.grade]}
                {agent.fonction && <> — <span className="text-slate-500">{agent.fonction}</span></>}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                <span className="font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">{agent.matricule}</span>
                {agent.direction && (
                  <span className="flex items-center gap-1"><Award size={11} />{agent.direction.code} — {agent.direction.nom}</span>
                )}
                {agent.dateEntree && (
                  <span className="flex items-center gap-1"><Calendar size={11} />Depuis {formatDate(agent.dateEntree, 'dd/MM/yyyy')}</span>
                )}
              </div>
            </div>

            {/* Stats rapides */}
            <div className="flex gap-4 shrink-0">
              <Stat label="Missions" value={agent.participations?.length ?? 0} color="text-blue-600" />
              <Stat label="Terminées" value={missionsTerminees} color="text-emerald-600" />
              <Stat label="En cours" value={missionsActives} color="text-amber-600" />
              {age !== null && <Stat label="Âge" value={`${age} ans`} color="text-slate-600" />}
            </div>
          </div>
        </div>
      </div>

      {/* ── Onglets ───────────────────────────────────── */}
      <div className="flex gap-0 bg-white rounded-lg border border-slate-200 overflow-hidden">
        {[
          { key: 'profil', label: 'Profil', icon: <Activity size={14} /> },
          { key: 'missions', label: `Missions (${agent.participations?.length ?? 0})`, icon: <Briefcase size={14} /> },
          { key: 'postes', label: `Postes (${agent.postesAffecter?.length ?? 0})`, icon: <MapPin size={14} /> },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as typeof tab)}
            className={cn(
              'flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors border-b-2',
              tab === key
                ? 'text-blue-600 border-blue-500 bg-blue-50/50'
                : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
            )}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      {/* ── Contenu onglet Profil ─────────────────────── */}
      {tab === 'profil' && (
        <div className="grid grid-cols-2 gap-4">
          <InfoCard title="Informations personnelles">
            <Row icon={<Globe size={14} />} label="Province d'origine" value={agent.provinceOrigine} />
            <Row icon={<Award size={14} />} label="Études" value={agent.etudesFaites} />
            <Row icon={<Calendar size={14} />} label="Date de naissance" value={agent.dateNaissance ? formatDate(agent.dateNaissance) : undefined} />
            <Row icon={<Activity size={14} />} label="Sexe" value={agent.sexe === 'M' ? 'Masculin' : agent.sexe === 'F' ? 'Féminin' : undefined} />
          </InfoCard>
          <InfoCard title="Informations professionnelles">
            <Row icon={<FileText size={14} />} label="Acte de nomination" value={agent.acteDeNomination} />
            <Row icon={<Award size={14} />} label="Spécialité" value={agent.specialite} />
            <Row icon={<Phone size={14} />} label="Téléphone" value={agent.telephone} />
            <Row icon={<Mail size={14} />} label="Email" value={agent.email} />
          </InfoCard>
          {agent.biographie && (
            <div className="col-span-2">
              <InfoCard title="Observations">
                <p className="text-sm text-slate-700 leading-relaxed">{agent.biographie}</p>
              </InfoCard>
            </div>
          )}
        </div>
      )}

      {/* ── Contenu onglet Missions ───────────────────── */}
      {tab === 'missions' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {!agent.participations?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Briefcase size={32} className="text-slate-300 mb-3" />
              <p className="text-slate-500">Aucune mission enregistrée</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {agent.participations.map((p:any) => {
                if (!p.mission) return null;
                const m = p.mission;
                const mStatus = m.status as MissionStatus;
                return (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/missions/${m.id}`)}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 cursor-pointer group transition-colors"
                  >
                    <div className={cn('w-2 h-2 rounded-full flex-shrink-0', MISSION_STATUS_DOT[mStatus])} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{m.objet}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                        {m.reference && <span className="font-mono text-slate-400">{m.reference}</span>}
                        <span className="flex items-center gap-1"><MapPin size={11} />{m.ville}, {m.pays}</span>
                        {m.dateDebut && m.dateFin && (
                          <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(m.dateDebut)} → {formatDate(m.dateFin)}</span>
                        )}
                        {m.dureeJours && <span>{m.dureeJours}j</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full border', ROLE_STYLE[p.role])}>
                        {MISSION_ROLE_LABELS[p.role]}
                      </span>
                      <span className="text-[11px] text-slate-500">{MISSION_STATUS_LABELS[mStatus]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Contenu onglet Postes ─────────────────────── */}
      {tab === 'postes' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {!agent.postesAffecter?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MapPin size={32} className="text-slate-300 mb-3" />
              <p className="text-slate-500">Aucun poste enregistré</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {agent.postesAffecter.map((poste) => (
                <div key={poste.id} className="flex items-center gap-4 px-5 py-4">
                  <div className={cn('w-2 h-2 rounded-full', poste.estActuel ? 'bg-emerald-400' : 'bg-slate-300')} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{poste.intitule}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={11} />{poste.ville}, {poste.pays}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-600">
                      {formatDate(poste.dateDebut)} — {poste.dateFin ? formatDate(poste.dateFin) : 'présent'}
                    </p>
                    {poste.estActuel && (
                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Actuel</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal edit */}
      {editOpen && <AgentFormModal agent={agent} onClose={() => setEditOpen(false)} />}
    </div>
  );
}

// ── Sous-composants ───────────────────────────────────────
function Stat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="text-center">
      <div className={cn('text-xl font-bold', color)}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="px-5 py-4 space-y-3">{children}</div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-slate-400 mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm text-slate-800 font-medium">{value}</p>
      </div>
    </div>
  );
}
