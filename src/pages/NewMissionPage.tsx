import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft, MapPin, Calendar, FileText, RefreshCw,
  AlertCircle, CheckCircle2, Users, Search, X, Crown, Star,
} from 'lucide-react';
import { useCreateMission, useGenerateReference, useAddParticipant } from '../hooks/useMissions';
import { useAgents } from '../hooks/useAgents';
import { MISSION_TYPE_LABELS, MISSION_ROLE_LABELS, AGENT_GRADE_LABELS, cn, getPhotoUrl } from '../lib/utils';
import type { MissionType, MissionRole, Agent } from '../types';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

// ── Types ─────────────────────────────────────────────────
interface Direction { id: string; code: string; nom: string; }

type FormData = {
  reference: string; objet: string; description: string;
  type: MissionType | ''; ville: string; pays: string;
  codeIso: string; dateDebut: string; dateFin: string; directionId: string;
};

interface ParticipantDraft {
  agent: Agent;
  role: MissionRole;
}

// ── Constantes ────────────────────────────────────────────
const MISSION_TYPES = Object.entries(MISSION_TYPE_LABELS) as [MissionType, string][];

const TYPE_ICONS: Record<MissionType, string> = {
  DIPLOMATIQUE: '🤝', ECONOMIQUE: '💰', CONSULAIRE: '🏛️',
  SECURITAIRE: '🛡️', CULTURELLE: '🎭', HUMANITAIRE: '❤️', MULTILATERALE: '🌐',
};

const ROLES: { value: MissionRole; label: string; isChef?: boolean }[] = [
  { value: 'CHEF_DE_MISSION',     label: 'Chef de Mission',      isChef: true  },
  { value: 'CHEF_DE_DELEGATION',  label: 'Chef de Délégation',   isChef: true  },
  { value: 'EXPERT',              label: 'Expert'                              },
  { value: 'RAPPORTEUR',          label: 'Rapporteur'                          },
  { value: 'CONSEILLER_TECHNIQUE',label: 'Conseiller Technique'                },
  { value: 'ATTACHE_DE_PRESSE',   label: 'Attaché de Presse'                   },
  { value: 'PROTOCOLE',           label: 'Protocole'                           },
  { value: 'OBSERVATEUR',         label: 'Observateur'                         },
  { value: 'MEMBRE',              label: 'Membre'                              },
];

// ── Micro-composants ──────────────────────────────────────
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
      {children}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900',
        'placeholder-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-400',
        'disabled:bg-slate-50 disabled:text-slate-500',
        className,
      )}
      {...props}
    />
  );
}

function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900',
        'placeholder-slate-400 transition-all resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-400',
        className,
      )}
      {...props}
    />
  );
}

function FSelect({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select
      className={cn(
        'w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900',
        'transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-400',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

function Section({ icon, title, badge, children }: { icon: React.ReactNode; title: string; badge?: number; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
        {icon}
        <h3 className="text-sm font-bold text-slate-700">{title}</h3>
        {badge !== undefined && badge > 0 && (
          <span className="ml-1 text-xs font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">{badge}</span>
        )}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1 text-xs text-red-600 mt-1.5">
      <AlertCircle size={11} />{children}
    </p>
  );
}

// ── Page ──────────────────────────────────────────────────
export function NewMissionPage() {
  const navigate = useNavigate();
  const createMission = useCreateMission();
  const addParticipant = useAddParticipant();
  const { data: refData, refetch: refetchRef } = useGenerateReference();

  const { data: directionsData } = useQuery<{ success: boolean; data: Direction[] }>({
    queryKey: ['directions'],
    queryFn: () => api.get('/directions').then((r) => r.data),
  });
  const directions = directionsData?.data ?? [];

  // ── État formulaire ────────────────────────────────────
  const [form, setForm] = useState<FormData>({
    reference: '', objet: '', description: '',
    type: '', ville: '', pays: '', codeIso: '',
    dateDebut: '', dateFin: '', directionId: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [success, setSuccess] = useState(false);

  // ── État composition ───────────────────────────────────
  // Responsable = Chef de Mission (obligatoire avant soumission si renseigné, mais non bloquant)
  const [responsable, setResponsable] = useState<Agent | null>(null);
  const [respSearch, setRespSearch] = useState('');
  const [showRespDropdown, setShowRespDropdown] = useState(false);
  const respRef = useRef<HTMLDivElement>(null);

  // Autres membres (optionnels)
  const [participants, setParticipants] = useState<ParticipantDraft[]>([]);
  const [agentSearch, setAgentSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [pendingAgent, setPendingAgent] = useState<Agent | null>(null);
  const [pendingRole, setPendingRole] = useState<MissionRole>('MEMBRE');
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: respAgentsData } = useAgents({ search: respSearch || undefined, limit: 6 });
  const respResults = (respAgentsData?.data ?? []).filter((a) => a.id !== responsable?.id);

  const { data: agentsData } = useAgents({ search: agentSearch || undefined, limit: 6 });
  // Exclure le responsable ET les déjà ajoutés
  const agentResults = (agentsData?.data ?? []).filter(
    (a) => a.id !== responsable?.id && !participants.some((p) => p.agent.id === a.id)
  );

  // Référence auto
  useEffect(() => {
    if (refData?.data?.reference && !form.reference) {
      setForm((f) => ({ ...f, reference: refData.data.reference }));
    }
  }, [refData]);

  // Fermer dropdowns en cliquant dehors
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDropdown(false);
      if (respRef.current && !respRef.current.contains(e.target as Node)) setShowRespDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const set = (key: keyof FormData, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
  };

  const dureeJours = form.dateDebut && form.dateFin
    ? Math.ceil((new Date(form.dateFin).getTime() - new Date(form.dateDebut).getTime()) / 86_400_000)
    : null;

  // ── Ajouter un participant au draft ────────────────────
  const addToDraft = () => {
    if (!pendingAgent) return;
    setParticipants((prev) => [...prev, { agent: pendingAgent, role: pendingRole }]);
    setPendingAgent(null);
    setAgentSearch('');
    setPendingRole('MEMBRE');
  };

  const removeFromDraft = (agentId: string) =>
    setParticipants((prev) => prev.filter((p) => p.agent.id !== agentId));

  const updateRole = (agentId: string, role: MissionRole) =>
    setParticipants((prev) => prev.map((p) => p.agent.id === agentId ? { ...p, role } : p));

  // Le responsable joue le rôle de Chef de Mission
  const chefExistant = responsable ? { agent: responsable } : null;

  // ── Validation ─────────────────────────────────────────
  const validate = (): boolean => {
    const e: Partial<FormData> = {};
    if (!form.reference) e.reference = 'Requis';
    if (!form.objet.trim()) e.objet = 'Requis';
    if (!form.type) e.type = 'Requis' as MissionType;
    if (!form.ville.trim()) e.ville = 'Requis';
    if (!form.pays.trim()) e.pays = 'Requis';
    if (!form.dateDebut) e.dateDebut = 'Requis';
    if (!form.dateFin) e.dateFin = 'Requis';
    if (form.dateDebut && form.dateFin && new Date(form.dateFin) <= new Date(form.dateDebut))
      e.dateFin = 'La date de fin doit être après le début';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Soumission ─────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const result = await createMission.mutateAsync(form as never);
      const missionId: string = result.data.id;

      // Le responsable est ajouté EN PREMIER comme Chef de Mission
      if (responsable) {
        await addParticipant.mutateAsync({ missionId, agentId: responsable.id, role: 'CHEF_DE_MISSION' });
      }

      // Puis les autres membres
      for (const p of participants) {
        await addParticipant.mutateAsync({ missionId, agentId: p.agent.id, role: p.role });
      }

      setSuccess(true);
      setTimeout(() => navigate(`/missions/${missionId}`), 1200);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setErrors({ reference: axiosErr.response?.data?.message || 'Erreur lors de la création' });
    }
  };

  const isPending = createMission.isPending || addParticipant.isPending;

  if (success) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 size={28} className="text-emerald-600" />
          </div>
          <p className="text-slate-900 font-semibold">Mission créée avec succès !</p>
          {(responsable || participants.length > 0) && (
            <p className="text-slate-500 text-sm mt-1">
              {[
                responsable ? '1 responsable' : '',
                participants.length > 0
                  ? `${participants.length} membre${participants.length > 1 ? 's' : ''}`
                  : '',
              ]
                .filter(Boolean)
                .join(' + ')}{' '}
              ajouté{(responsable || participants.length > 1) ? 's' : ''}
            </p>
          )}
          <p className="text-slate-400 text-xs mt-1">Redirection vers la fiche...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-5">
        <Link to="/missions" className="hover:text-slate-800 flex items-center gap-1 transition-colors">
          <ChevronLeft size={15} />Missions
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-700 font-medium">Nouvelle mission</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── Section 1 : Identification ──────────────── */}
        <Section icon={<FileText size={15} className="text-blue-500" />} title="Identification de la mission">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Référence</FieldLabel>
              <div className="relative">
                <Input
                  value={form.reference}
                  onChange={(e) => set('reference', e.target.value)}
                  placeholder="MSN-2026-0001"
                  className={cn('pr-9', errors.reference && 'border-red-400 bg-red-50/50')}
                />
                <button type="button" onClick={() => refetchRef()}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors" title="Générer">
                  <RefreshCw size={14} />
                </button>
              </div>
              {errors.reference && <FieldError>{errors.reference}</FieldError>}
            </div>
            <div>
              <FieldLabel>Direction responsable</FieldLabel>
              <FSelect value={form.directionId} onChange={(e) => set('directionId', e.target.value)}>
                <option value="">— Sélectionner —</option>
                {directions.map((d) => <option key={d.id} value={d.id}>{d.code} — {d.nom}</option>)}
              </FSelect>
            </div>
          </div>
          <div>
            <FieldLabel required>Objet de la mission</FieldLabel>
            <Input value={form.objet} onChange={(e) => set('objet', e.target.value)}
              placeholder="Ex: Participation au Sommet de l'Union Africaine — Addis-Abeba"
              className={cn(errors.objet && 'border-red-400 bg-red-50/50')} />
            {errors.objet && <FieldError>{errors.objet}</FieldError>}
          </div>
          <div>
            <FieldLabel>Description</FieldLabel>
            <Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)}
              placeholder="Contexte, objectifs, résultats attendus..." />
          </div>
        </Section>

        {/* ── Section 2 : Type ────────────────────────── */}
        <Section icon={<span className="text-base">🎯</span>} title="Type de mission">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {MISSION_TYPES.map(([val, label]) => (
              <button key={val} type="button" onClick={() => set('type', val)}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 text-xs font-semibold transition-all',
                  form.type === val ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                )}>
                <span className="text-xl">{TYPE_ICONS[val]}</span>{label}
              </button>
            ))}
          </div>
          {errors.type && <FieldError>{errors.type}</FieldError>}
        </Section>

        {/* ── Section 3 : Localisation ─────────────────── */}
        <Section icon={<MapPin size={15} className="text-red-500" />} title="Localisation">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <FieldLabel required>Pays</FieldLabel>
              <Input value={form.pays} onChange={(e) => set('pays', e.target.value)} placeholder="Ex: Belgique"
                className={cn(errors.pays && 'border-red-400 bg-red-50/50')} />
              {errors.pays && <FieldError>{errors.pays}</FieldError>}
            </div>
            <div>
              <FieldLabel>Code ISO</FieldLabel>
              <Input value={form.codeIso} onChange={(e) => set('codeIso', e.target.value.toUpperCase().slice(0, 3))}
                placeholder="BE" maxLength={3} />
            </div>
          </div>
          <div>
            <FieldLabel required>Ville</FieldLabel>
            <Input value={form.ville} onChange={(e) => set('ville', e.target.value)} placeholder="Ex: Bruxelles"
              className={cn(errors.ville && 'border-red-400 bg-red-50/50')} />
            {errors.ville && <FieldError>{errors.ville}</FieldError>}
          </div>
        </Section>

        {/* ── Section 4 : Dates ───────────────────────── */}
        <Section icon={<Calendar size={15} className="text-emerald-500" />} title="Période de la mission">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Date de début</FieldLabel>
              <Input type="date" value={form.dateDebut} onChange={(e) => set('dateDebut', e.target.value)}
                className={cn(errors.dateDebut && 'border-red-400 bg-red-50/50')} />
              {errors.dateDebut && <FieldError>{errors.dateDebut}</FieldError>}
            </div>
            <div>
              <FieldLabel required>Date de fin</FieldLabel>
              <Input type="date" value={form.dateFin} min={form.dateDebut} onChange={(e) => set('dateFin', e.target.value)}
                className={cn(errors.dateFin && 'border-red-400 bg-red-50/50')} />
              {errors.dateFin && <FieldError>{errors.dateFin}</FieldError>}
            </div>
          </div>
          {dureeJours !== null && dureeJours > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 text-sm text-blue-700">
              <Calendar size={14} /><span>Durée calculée : <strong>{dureeJours} jour{dureeJours > 1 ? 's' : ''}</strong></span>
            </div>
          )}
          {dureeJours !== null && dureeJours <= 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5 text-sm text-red-600">
              <AlertCircle size={14} />La date de fin doit être postérieure à la date de début
            </div>
          )}
        </Section>

        {/* ── Section 5 : Composition ─────────────────── */}
        <Section
          icon={<Users size={15} className="text-violet-500" />}
          title="Composition de la délégation"
          badge={participants.length + (responsable ? 1 : 0)}
        >

          {/* ── Responsable (Chef de Mission) — obligatoire ── */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Crown size={14} className="text-amber-500" />
              <FieldLabel required>Responsable de la mission (Chef de Mission)</FieldLabel>
            </div>

            <div ref={respRef} className="relative">
              {responsable ? (
                /* Agent sélectionné */
                <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border-2 border-amber-300 rounded-lg">
                  <div className="w-9 h-9 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {getPhotoUrl(responsable.photoUrl)
                      ? <img src={getPhotoUrl(responsable.photoUrl)!} alt="" className="w-full h-full object-cover" />
                      : <>{responsable.nom[0]}{responsable.prenom[0]}</>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Crown size={12} className="text-amber-600 shrink-0" />
                      <p className="text-sm font-bold text-amber-900">{responsable.prenom} {responsable.nom}</p>
                    </div>
                    <p className="text-xs text-amber-700">{AGENT_GRADE_LABELS[responsable.grade]} · Chef de Mission</p>
                  </div>
                  <button type="button" onClick={() => setResponsable(null)}
                    className="p-1 rounded text-amber-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                /* Champ de recherche */
                <>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      value={respSearch}
                      onChange={(e) => { setRespSearch(e.target.value); setShowRespDropdown(true); }}
                      onFocus={() => setShowRespDropdown(true)}
                      placeholder="Rechercher le responsable par nom ou matricule..."
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-300 bg-white hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 transition-all"
                    />
                  </div>
                  {showRespDropdown && respSearch && (
                    <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                      {respResults.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-slate-400 text-center">Aucun agent trouvé</div>
                      ) : (
                        respResults.map((agent) => (
                          <button key={agent.id} type="button"
                            onClick={() => { setResponsable(agent); setRespSearch(''); setShowRespDropdown(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-amber-50 transition-colors text-left">
                            <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {getPhotoUrl(agent.photoUrl)
                                ? <img src={getPhotoUrl(agent.photoUrl)!} alt="" className="w-full h-full object-cover" />
                                : <>{agent.nom[0]}{agent.prenom[0]}</>}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-900 truncate">{agent.prenom} {agent.nom}</p>
                              <p className="text-xs text-slate-500">{AGENT_GRADE_LABELS[agent.grade]} · {agent.matricule}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Séparateur */}
          <div className="border-t border-slate-100" />

          {/* ── Autres membres (optionnels) ──────────── */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Autres membres <span className="normal-case font-normal text-slate-400">(optionnel)</span>
            </p>

            <div ref={searchRef} className="space-y-3">
              <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                <div>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      value={pendingAgent ? `${pendingAgent.prenom} ${pendingAgent.nom}` : agentSearch}
                      onChange={(e) => { if (pendingAgent) setPendingAgent(null); setAgentSearch(e.target.value); setShowDropdown(true); }}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="Ajouter un membre..."
                      className={cn(
                        'w-full pl-9 pr-8 py-2.5 text-sm rounded-lg border transition-all',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
                        pendingAgent ? 'border-blue-400 bg-blue-50 font-medium' : 'border-slate-300 bg-white hover:border-slate-400',
                      )}
                    />
                    {pendingAgent && (
                      <button type="button" onClick={() => { setPendingAgent(null); setAgentSearch(''); }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                        <X size={14} />
                      </button>
                    )}
                    {showDropdown && agentSearch && !pendingAgent && (
                      <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden max-h-44 overflow-y-auto">
                        {agentResults.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-slate-400 text-center">Aucun agent disponible</div>
                        ) : (
                          agentResults.map((agent) => (
                            <button key={agent.id} type="button"
                              onClick={() => { setPendingAgent(agent); setShowDropdown(false); }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left">
                              <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {getPhotoUrl(agent.photoUrl)
                                  ? <img src={getPhotoUrl(agent.photoUrl)!} alt="" className="w-full h-full object-cover" />
                                  : <>{agent.nom[0]}{agent.prenom[0]}</>}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-900 truncate">{agent.prenom} {agent.nom}</p>
                                <p className="text-xs text-slate-500">{AGENT_GRADE_LABELS[agent.grade]} · {agent.matricule}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <FSelect value={pendingRole} onChange={(e) => setPendingRole(e.target.value as MissionRole)} className="w-44">
                  {ROLES.filter((r) => !r.isChef).map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </FSelect>
              </div>

              {pendingAgent && (
                <button type="button" onClick={addToDraft}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition hover:opacity-90"
                  style={{ backgroundColor: '#007FFF' }}>
                  <Users size={14} />
                  Ajouter {pendingAgent.prenom} {pendingAgent.nom} · {MISSION_ROLE_LABELS[pendingRole]}
                </button>
              )}
            </div>

            {/* Liste membres */}
            {participants.length > 0 && (
              <div className="space-y-2 mt-3">
                {participants.map((p) => (
                  <div key={p.agent.id} className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {getPhotoUrl(p.agent.photoUrl)
                        ? <img src={getPhotoUrl(p.agent.photoUrl)!} alt="" className="w-full h-full object-cover" />
                        : <>{p.agent.nom[0]}{p.agent.prenom[0]}</>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{p.agent.prenom} {p.agent.nom}</p>
                      <p className="text-xs text-slate-500">{AGENT_GRADE_LABELS[p.agent.grade]}</p>
                    </div>
                    <select value={p.role} onChange={(e) => updateRole(p.agent.id, e.target.value as MissionRole)}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs font-semibold rounded-md px-2 py-1 border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                      {ROLES.filter((r) => !r.isChef).map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => removeFromDraft(p.agent.id)}
                      className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {participants.length === 0 && (
              <p className="text-xs text-slate-400 text-center mt-3">
                Vous pourrez ajouter d'autres membres depuis la fiche mission
              </p>
            )}
          </div>
        </Section>

        {/* ── Actions ─────────────────────────────────── */}
        <div className="flex items-center justify-between pt-2 pb-6">
          <Link to="/missions" className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
            Annuler
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className={cn('flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition-all', isPending ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90 active:scale-[0.98]')}
            style={{ backgroundColor: '#007FFF' }}
          >
            {isPending
              ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Création en cours...</>
              : <>Créer la mission{(responsable || participants.length > 0) ? ` + ${(responsable ? 1 : 0) + participants.length} participant${(responsable ? 1 : 0) + participants.length > 1 ? 's' : ''}` : ''}</>
            }
          </button>
        </div>
      </form>
    </div>
  );
}
