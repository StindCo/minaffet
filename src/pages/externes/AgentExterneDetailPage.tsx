import { useParams, useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { ArrowLeft, MapPin, Calendar, Globe2, User, Edit2, CheckCircle2, AlertTriangle, Clock, FileText, Camera } from 'lucide-react';
import { useAgentExterne, useUploadAgentExternePhoto } from '../../hooks/useAgentsExternes';
import { useValiderMutation, useTerminerMutation } from '../../hooks/useMutations';
import { MutationModal } from '../../components/externes/MutationModal';
import { StatutMutationBadge } from '../../components/externes/StatutMutationBadge';
import { AgentExterneFormModal } from '../../components/externes/AgentExterneFormModal';
import { AgentDocuments } from '../../components/externes/AgentDocuments';
import { PROVINCE_LABELS, TYPE_AGENT_LABELS } from '../../types';
import { AGENT_GRADE_LABELS, getPhotoUrl, cn, formatDate } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { useState } from 'react';
import type { Mutation } from '../../types';

function countryFlag(codeIso2?: string | null): string {
  if (!codeIso2 || codeIso2.length !== 2) return '🌐';
  const codePoints = [...codeIso2.toUpperCase()].map(
    (c) => 0x1F1E6 + c.charCodeAt(0) - 65
  );
  return String.fromCodePoint(...codePoints);
}

function daysLeft(dateFin: string): number {
  return Math.floor((new Date(dateFin).getTime() - Date.now()) / 86400000);
}

export function AgentExterneDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canWrite, isAdmin } = useAuthStore();

  const [showMutationModal, setShowMutationModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const uploadPhoto = useUploadAgentExternePhoto();

  const { data, isLoading, error } = useAgentExterne(id!);
  const agent = data?.data;

  const validerMutation = useValiderMutation(id!);
  const terminerMutation = useTerminerMutation(id!);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400">
        <div className="animate-spin w-6 h-6 border-2 border-rdc-blue border-t-transparent rounded-full mr-3" />
        Chargement…
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <Globe2 size={40} className="mb-3 opacity-20" />
        <p className="font-medium">Membre du personnel introuvable</p>
        <button onClick={() => navigate('/externes')} className="mt-3 text-rdc-blue text-sm hover:underline">
          ← Retour à la liste
        </button>
      </div>
    );
  }

  const photo = getPhotoUrl(agent.photoUrl);
  const mutations = agent.mutations ?? [];
  const mutationActive = mutations.find((m) => !m.validee && m.statut !== 'TERMINEE');

  async function handleValider(mut: Mutation) {
    if (!window.confirm('Valider cette mutation ? Le pays d\'affectation du membre du personnel sera mis à jour.')) return;
    try {
      await validerMutation.mutateAsync(mut.id);
    } catch {
      alert('Erreur lors de la validation');
    }
  }

  async function handleTerminer(mut: Mutation) {
    if (!window.confirm('Terminer cette mutation manuellement ?')) return;
    try {
      await terminerMutation.mutateAsync(mut.id);
    } catch {
      alert('Erreur lors de la clôture');
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">

      {/* Breadcrumb */}
      <button
        onClick={() => navigate('/externes')}
        className="flex items-center gap-1.5 text-slate-400 hover:text-rdc-blue text-sm mb-5 transition-colors"
      >
        <ArrowLeft size={14} /> Personnel extérieur
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Colonne gauche : profil ─────────────────────── */}
        <div className="space-y-4">

          {/* Card profil */}
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
            {/* Banner */}
            <div className={cn(
              'h-20 relative',
              agent.typeAgent === 'DIPLOMATE'
                ? 'bg-gradient-to-br from-rdc-navy to-rdc-blue-dark'
                : 'bg-gradient-to-br from-violet-800 to-violet-600'
            )}>
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'white\' fill-opacity=\'1\'%3E%3Cpath d=\'M0 40L40 0H20L0 20M40 40V20L20 40\'/%3E%3C/g%3E%3C/svg%3E")' }}
              />
            </div>

            <div className="px-5 pb-5">
              {/* Avatar + upload photo */}
              <div className="-mt-10 mb-3 relative inline-block group">
                <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-slate-100 flex items-center justify-center">
                  {photo
                    ? <img src={photo} alt="" className="w-full h-full object-cover" />
                    : <span className="text-slate-400 font-bold text-2xl">{agent.nom[0]}{agent.prenom[0]}</span>
                  }
                </div>
                {canWrite() && (
                  <>
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      disabled={uploadPhoto.isPending}
                      title="Modifier la photo"
                      className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      {uploadPhoto.isPending
                        ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <Camera size={18} className="text-white" />
                      }
                    </button>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f) await uploadPhoto.mutateAsync({ id: agent.id, file: f });
                      }}
                    />
                  </>
                )}
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <h1 className="font-extrabold text-slate-800 text-lg leading-tight">
                    {agent.prenom} {agent.nom}
                  </h1>
                  <p className="text-slate-400 text-xs mt-0.5">{agent.matricule}</p>
                </div>
                {canWrite() && (
                  <button onClick={() => setShowEditModal(true)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-rdc-blue hover:bg-slate-50 rounded-lg transition-colors">
                    <Edit2 size={11} /> Modifier
                  </button>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                <span className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-bold border',
                  agent.typeAgent === 'DIPLOMATE'
                    ? 'bg-rdc-blue/10 text-rdc-blue border-rdc-blue/20'
                    : 'bg-violet-50 text-violet-700 border-violet-200'
                )}>
                  {TYPE_AGENT_LABELS[agent.typeAgent]}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  {agent.sexe === 'F' ? 'Féminin' : 'Masculin'}
                </span>
              </div>

              {/* Infos */}
              <div className="mt-4 space-y-2">
                <InfoRow icon={<User size={13} />} label="Grade" value={AGENT_GRADE_LABELS[agent.grade]} />
                {agent.fonction && <InfoRow icon={<FileText size={13} />} label="Fonction" value={agent.fonction} />}
                {agent.provinceOrigine && (
                  <InfoRow icon={<MapPin size={13} />} label="Province" value={PROVINCE_LABELS[agent.provinceOrigine]} />
                )}
                {agent.dateNaissance && (
                  <InfoRow icon={<Calendar size={13} />} label="Naissance" value={formatDate(agent.dateNaissance)} />
                )}
                {agent.email && <InfoRow icon={<Globe2 size={13} />} label="Email" value={agent.email} />}
              </div>
            </div>
          </div>

          {/* Affectation actuelle */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Affectation actuelle</p>
            {agent.paysActuel ? (
              <div className="flex items-center gap-3">
                <span className="text-3xl">{countryFlag(agent.paysActuel.codeIso2)}</span>
                <div>
                  <p className="font-bold text-slate-800">{agent.paysActuel.nom}</p>
                  {agent.paysActuel.region && (
                    <p className="text-slate-400 text-xs">{agent.paysActuel.region.nom}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-slate-300 text-sm italic">Non affecté</p>
            )}

            {mutationActive && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <StatutMutationBadge statut={mutationActive.statut} />
                  {(() => {
                    const d = daysLeft(mutationActive.dateFin);
                    return (
                      <span className={cn('text-xs font-semibold', d < 0 ? 'text-rdc-red' : d < 180 ? 'text-amber-600' : 'text-slate-400')}>
                        {d < 0 ? `${Math.abs(d)}j dépassé` : `${d}j restants`}
                      </span>
                    );
                  })()}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {formatDate(mutationActive.dateDebut)} → {formatDate(mutationActive.dateFin)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Colonne droite : mutations ───────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Header mutations */}
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-base">Historique des mutations</h2>
            {canWrite() && !mutationActive && (
              <button
                onClick={() => setShowMutationModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-rdc-blue text-white text-sm font-semibold rounded-lg hover:bg-rdc-blue-dark transition-colors"
              >
                <Calendar size={14} /> Nouvelle mutation
              </button>
            )}
            {mutationActive && (
              <span className="text-xs text-slate-400 italic">Mutation active en cours</span>
            )}
          </div>

          {mutations.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center">
              <Globe2 size={36} className="mx-auto text-slate-200 mb-3" />
              <p className="text-slate-400 text-sm">Aucune mutation enregistrée</p>
              {canWrite() && (
                <button
                  onClick={() => setShowMutationModal(true)}
                  className="mt-3 px-4 py-2 bg-rdc-blue text-white text-sm font-semibold rounded-lg hover:bg-rdc-blue-dark transition-colors"
                >
                  Créer la première mutation
                </button>
              )}
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[18px] top-6 bottom-6 w-[2px] bg-slate-100" />

              <div className="space-y-3">
                {mutations.map((mut, idx) => {
                  const isActive = !mut.validee && mut.statut !== 'TERMINEE';
                  const jours = daysLeft(mut.dateFin);

                  return (
                    <div key={mut.id} className={cn(
                      'relative pl-10 pr-4 py-4 bg-white border rounded-2xl transition-all',
                      isActive ? 'border-rdc-blue/30 shadow-sm shadow-rdc-blue/5' : 'border-slate-100'
                    )}>
                      {/* Point timeline */}
                      <div className={cn(
                        'absolute left-3.5 top-5 w-[10px] h-[10px] rounded-full border-2 z-10',
                        idx === 0 && isActive
                          ? 'border-rdc-blue bg-rdc-blue'
                          : mut.statut === 'FIN_TERME'
                          ? 'border-rdc-red bg-rdc-red'
                          : mut.statut === 'COURT_TERME'
                          ? 'border-amber-500 bg-amber-500'
                          : 'border-slate-300 bg-white'
                      )} />

                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <StatutMutationBadge statut={mut.statut} />
                            {isActive && (
                              <span className="text-[10px] font-bold text-rdc-blue uppercase tracking-wide bg-rdc-blue/10 px-1.5 py-0.5 rounded">
                                Active
                              </span>
                            )}
                          </div>

                          {/* Pays + poste */}
                          <div className="flex items-center gap-2 mb-1">
                            {mut.pays && (
                              <span className="text-base">{countryFlag(mut.pays.codeIso2)}</span>
                            )}
                            <p className="font-semibold text-slate-800 text-sm">
                              {mut.posteDiplomatique?.nom ?? mut.pays?.nom ?? 'Pays non précisé'}
                            </p>
                          </div>

                          {mut.posteDiplomatique && (
                            <p className="text-xs text-slate-400 mb-1">
                              {mut.posteDiplomatique.type} · {mut.pays?.nom}
                            </p>
                          )}

                          <p className="text-xs text-slate-400">
                            {formatDate(mut.dateDebut)} → {formatDate(mut.dateFin)}
                          </p>

                          {isActive && (
                            <div className="mt-2">
                              {jours < 0 ? (
                                <div className="flex items-center gap-1.5 text-rdc-red text-xs font-semibold">
                                  <AlertTriangle size={11} />
                                  Mandat dépassé de {Math.abs(jours)} jour(s)
                                </div>
                              ) : jours <= 180 ? (
                                <div className="flex items-center gap-1.5 text-amber-600 text-xs font-semibold">
                                  <Clock size={11} />
                                  {jours} jour(s) restant(s) — Court terme
                                </div>
                              ) : (
                                <div className="text-emerald-600 text-xs font-semibold">
                                  {jours} jour(s) restant(s)
                                </div>
                              )}
                              {/* Barre progression */}
                              <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                {(() => {
                                  const total = new Date(mut.dateFin).getTime() - new Date(mut.dateDebut).getTime();
                                  const passed = Date.now() - new Date(mut.dateDebut).getTime();
                                  const pct = Math.min(100, Math.max(0, (passed / total) * 100));
                                  return (
                                    <div
                                      className={cn('h-full rounded-full transition-all', jours < 0 ? 'bg-rdc-red' : jours <= 180 ? 'bg-amber-400' : 'bg-emerald-500')}
                                      style={{ width: `${pct}%` }}
                                    />
                                  );
                                })()}
                              </div>
                            </div>
                          )}

                          {mut.notes && (
                            <p className="mt-2 text-xs text-slate-400 italic border-l-2 border-slate-200 pl-2">{mut.notes}</p>
                          )}

                          {mut.validee && mut.valideePar && (
                            <p className="mt-1 text-xs text-slate-400">
                              Validé par {mut.valideePar.prenom} {mut.valideePar.nom}
                            </p>
                          )}
                        </div>

                        {/* Actions admin */}
                        {isAdmin() && isActive && (
                          <div className="flex flex-col gap-2 shrink-0">
                            <button
                              onClick={() => handleValider(mut)}
                              disabled={validerMutation.isPending}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-60"
                            >
                              <CheckCircle2 size={12} /> Valider
                            </button>
                            <button
                              onClick={() => handleTerminer(mut)}
                              disabled={terminerMutation.isPending}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 text-slate-500 text-xs font-semibold rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-60"
                            >
                              Terminer
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Biographie */}
          {agent.biographie && (
            <div className="bg-white border border-slate-100 rounded-2xl p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Biographie</p>
              <p className="text-slate-600 text-sm leading-relaxed">{agent.biographie}</p>
            </div>
          )}

          {/* Section documents */}
          <AgentDocuments agentId={agent.id} />
        </div>
      </div>

      {/* Modals */}
      {showMutationModal && (
        <MutationModal
          agentId={agent.id}
          agentNom={`${agent.prenom} ${agent.nom}`}
          onClose={() => setShowMutationModal(false)}
        />
      )}

      {showEditModal && (
        <AgentExterneFormModal
          agent={agent}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-slate-300 mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">{label}</p>
        <p className="text-sm text-slate-700 font-medium truncate">{value}</p>
      </div>
    </div>
  );
}
