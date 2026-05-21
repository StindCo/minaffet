import { useState, useEffect, useRef } from 'react';
import { X, AlertCircle, CheckCircle2, User, Camera } from 'lucide-react';
import { useCreateAgent, useUpdateAgent, useUploadAgentPhoto } from '../../hooks/useAgents';
import { compressImage } from '../../lib/imageUtils';
import { AGENT_GRADE_LABELS, AGENT_STATUS_LABELS, cn, getPhotoUrl } from '../../lib/utils';
import type { Agent, AgentGrade, AgentStatus } from '../../types';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

interface Direction { id: string; code: string; nom: string; }

type FormData = {
  nom: string; prenom: string; matricule: string; sexe: string;
  grade: AgentGrade | ''; status: AgentStatus | ''; fonction: string;
  specialite: string; acteDeNomination: string; dateNaissance: string;
  provinceOrigine: string; etudesFaites: string; telephone: string;
  email: string; dateEntree: string; biographie: string; directionId: string;
};

const EMPTY: FormData = {
  nom: '', prenom: '', matricule: '', sexe: '',
  grade: '', status: 'EN_POSTE', fonction: '',
  specialite: '', acteDeNomination: '', dateNaissance: '',
  provinceOrigine: '', etudesFaites: '', telephone: '',
  email: '', dateEntree: '', biographie: '', directionId: '',
};

interface Props { agent?: Agent; onClose: () => void; }

// ── Champs UI ─────────────────────────────────────────────
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <>
      <input
        {...props}
        className={cn(
          'w-full px-3 py-2 text-sm rounded-lg border bg-white text-slate-900 placeholder-slate-400',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all',
          error ? 'border-red-400 bg-red-50/30' : 'border-slate-300 hover:border-slate-400'
        )}
      />
      {error && <p className="flex items-center gap-1 text-xs text-red-600 mt-1"><AlertCircle size={11} />{error}</p>}
    </>
  );
}

function Select({ error, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string; children: React.ReactNode }) {
  return (
    <>
      <select
        {...props}
        className={cn(
          'w-full px-3 py-2 text-sm rounded-lg border bg-white text-slate-900',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all',
          error ? 'border-red-400' : 'border-slate-300 hover:border-slate-400'
        )}
      >
        {children}
      </select>
      {error && <p className="flex items-center gap-1 text-xs text-red-600 mt-1"><AlertCircle size={11} />{error}</p>}
    </>
  );
}

// ── Modal principale ──────────────────────────────────────
export function AgentFormModal({ agent, onClose }: Props) {
  const isEdit = !!agent;
  const overlayRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();
  const uploadPhoto = useUploadAgentPhoto();
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    getPhotoUrl(agent?.photoUrl)
  );
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);

  const { data: directionsData } = useQuery<{ success: boolean; data: Direction[] }>({
    queryKey: ['directions'],
    queryFn: () => api.get('/directions').then((r) => r.data),
  });
  const directions = directionsData?.data ?? [];

  const toDateInput = (d?: string) => {
    if (!d) return '';
    try { return new Date(d).toISOString().split('T')[0]; } catch { return ''; }
  };

  const [form, setForm] = useState<FormData>(() =>
    agent ? {
      nom: agent.nom, prenom: agent.prenom, matricule: agent.matricule,
      sexe: agent.sexe ?? '', grade: agent.grade, status: agent.status,
      fonction: agent.fonction ?? '', specialite: agent.specialite ?? '',
      acteDeNomination: agent.acteDeNomination ?? '',
      dateNaissance: toDateInput(agent.dateNaissance),
      provinceOrigine: agent.provinceOrigine ?? '',
      etudesFaites: agent.etudesFaites ?? '',
      telephone: agent.telephone ?? '', email: agent.email ?? '',
      dateEntree: toDateInput(agent.dateEntree),
      biographie: agent.biographie ?? '',
      directionId: agent.directionId ?? '',
    } : EMPTY
  );

  const set = (k: keyof FormData, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: '' }));
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setPendingPhoto(compressed);
      setPhotoPreview(URL.createObjectURL(compressed));
    } catch {
      // Fallback si compression échoue
      setPendingPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const validate = () => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.nom.trim()) e.nom = 'Requis';
    if (!form.prenom.trim()) e.prenom = 'Requis';
    if (!form.matricule.trim()) e.matricule = 'Requis';
    if (!form.grade) e.grade = 'Requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const payload = {
        ...form,
        grade: form.grade as AgentGrade,
        status: form.status as AgentStatus,
        sexe: form.sexe || undefined,
        dateNaissance: form.dateNaissance || undefined,
        dateEntree: form.dateEntree || undefined,
        directionId: form.directionId || undefined,
        acteDeNomination: form.acteDeNomination || undefined,
        provinceOrigine: form.provinceOrigine || undefined,
        etudesFaites: form.etudesFaites || undefined,
        fonction: form.fonction || undefined,
        specialite: form.specialite || undefined,
        telephone: form.telephone || undefined,
        email: form.email || undefined,
        biographie: form.biographie || undefined,
      };

      let agentId: string;
      if (isEdit) {
        await updateAgent.mutateAsync({ id: agent.id, ...payload });
        agentId = agent.id;
      } else {
        const result = await createAgent.mutateAsync(payload);
        agentId = result.data.id;
      }

      // Upload la photo si une nouvelle a été sélectionnée
      if (pendingPhoto && agentId) {
        await uploadPhoto.mutateAsync({ id: agentId, file: pendingPhoto });
      }

      setSuccess(true);
      setTimeout(onClose, 900);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setErrors({ matricule: axiosErr.response?.data?.message || 'Erreur lors de l\'enregistrement' });
    }
  };

  const isPending = createAgent.isPending || updateAgent.isPending || uploadPhoto.isPending;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl my-6 bg-white rounded-xl shadow-2xl border border-slate-200">

        {/* ── En-tête ──────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            {/* Avatar cliquable */}
            <div
              onClick={() => photoInputRef.current?.click()}
              className="relative w-12 h-12 rounded-xl cursor-pointer group shrink-0"
              title="Cliquer pour changer la photo"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Photo" className="w-full h-full rounded-xl object-cover" />
              ) : (
                <div className="w-full h-full rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center group-hover:border-blue-400 transition-colors">
                  <User size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                </div>
              )}
              <div className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={16} className="text-white" />
              </div>
            </div>
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />

            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEdit ? `Modifier — ${agent.prenom} ${agent.nom}` : 'Ajouter un agent'}
              </h2>
              <p className="text-xs text-slate-500">
                {photoPreview && !isEdit
                  ? 'Photo sélectionnée ✓ — complétez les informations ci-dessous'
                  : isEdit
                    ? 'Mettre à jour les informations de l\'agent'
                    : 'Cliquez sur l\'icône pour ajouter une photo'
                }
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded">
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-emerald-600" />
            </div>
            <p className="font-semibold text-slate-900">
              {isEdit ? 'Agent mis à jour !' : 'Agent créé avec succès !'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            {/* ── Identité ─────────────────────────────── */}
            <Section title="Identité">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nom" required>
                  <Input value={form.nom} onChange={(e) => set('nom', e.target.value.toUpperCase())} placeholder="KABILA" error={errors.nom} />
                </Field>
                <Field label="Prénom" required>
                  <Input value={form.prenom} onChange={(e) => set('prenom', e.target.value)} placeholder="Joseph" error={errors.prenom} />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Sexe">
                  <Select value={form.sexe} onChange={(e) => set('sexe', e.target.value)}>
                    <option value="">—</option>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </Select>
                </Field>
                <Field label="Date de naissance">
                  <Input type="date" value={form.dateNaissance} onChange={(e) => set('dateNaissance', e.target.value)} />
                </Field>
                <Field label="Province d'origine">
                  <Input value={form.provinceOrigine} onChange={(e) => set('provinceOrigine', e.target.value)} placeholder="Kinshasa" />
                </Field>
              </div>
              <Field label="Études faites">
                <Input value={form.etudesFaites} onChange={(e) => set('etudesFaites', e.target.value)} placeholder="Licence en Relations Internationales" />
              </Field>
            </Section>

            {/* ── Poste ────────────────────────────────── */}
            <Section title="Poste & Grade">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Matricule" required>
                  <Input value={form.matricule} onChange={(e) => set('matricule', e.target.value)} placeholder="DIP-2026-001" error={errors.matricule} />
                </Field>
                <Field label="Acte de nomination">
                  <Input value={form.acteDeNomination} onChange={(e) => set('acteDeNomination', e.target.value)} placeholder="Ordonnance N°..." />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Grade" required>
                  <Select value={form.grade} onChange={(e) => set('grade', e.target.value)} error={errors.grade}>
                    <option value="">— Sélectionner —</option>
                    {Object.entries(AGENT_GRADE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </Select>
                </Field>
                <Field label="Fonction / Titre">
                  <Input value={form.fonction} onChange={(e) => set('fonction', e.target.value)} placeholder="Chef de Mission, Représentant Permanent..." />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Spécialité / Domaine">
                  <Input value={form.specialite} onChange={(e) => set('specialite', e.target.value)} placeholder="Droit international, Économie..." />
                </Field>
                <Field label="Direction">
                  <Select value={form.directionId} onChange={(e) => set('directionId', e.target.value)}>
                    <option value="">— Sélectionner —</option>
                    {directions.map((d) => <option key={d.id} value={d.id}>{d.code} — {d.nom}</option>)}
                  </Select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Statut actuel">
                  <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
                    {Object.entries(AGENT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </Select>
                </Field>
                <Field label="Date de 1ère affectation">
                  <Input type="date" value={form.dateEntree} onChange={(e) => set('dateEntree', e.target.value)} />
                </Field>
              </div>
            </Section>

            {/* ── Contacts ─────────────────────────────── */}
            <Section title="Contacts">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Téléphone">
                  <Input value={form.telephone} onChange={(e) => set('telephone', e.target.value)} placeholder="+243 ..." type="tel" />
                </Field>
                <Field label="Email">
                  <Input value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="agent@mae.cd" type="email" />
                </Field>
              </div>
            </Section>

            {/* ── Observations ─────────────────────────── */}
            <Section title="Observations">
              <textarea
                rows={3}
                value={form.biographie}
                onChange={(e) => set('biographie', e.target.value)}
                placeholder="Remarques supplémentaires, notes biographiques..."
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-400 transition-all"
              />
            </Section>

            {/* ── Actions ──────────────────────────────── */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                Annuler
              </button>
              <button
                type="submit"
                disabled={isPending}
                className={cn('flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition-all', isPending ? 'opacity-70' : 'hover:opacity-90')}
                style={{ backgroundColor: '#007FFF' }}
              >
                {isPending
                  ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />{isEdit ? 'Mise à jour...' : 'Création...'}</>
                  : isEdit ? 'Mettre à jour' : 'Créer'
                }
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 pb-1.5 border-b border-slate-100">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
