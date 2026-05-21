import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import type { AgentExterne, AgentGrade, TypeAgent, ProvinceRDC } from '../../types';
import { PROVINCE_LABELS, TYPE_AGENT_LABELS } from '../../types';
import { AGENT_GRADE_LABELS } from '../../lib/utils';
import { usePays } from '../../hooks/usePays';
import { useCreateAgentExterne, useUpdateAgentExterne } from '../../hooks/useAgentsExternes';
import { cn } from '../../lib/utils';

const GRADES: AgentGrade[] = [
  'AMBASSADEUR','MINISTRE_CONSEILLER','CONSEILLER','PREMIER_SECRETAIRE',
  'DEUXIEME_SECRETAIRE','TROISIEME_SECRETAIRE','ATTACHE',
  'CONSUL_GENERAL','CONSUL','VICE_CONSUL',
];

const PROVINCES = Object.keys(PROVINCE_LABELS) as ProvinceRDC[];

interface Props {
  agent?: AgentExterne | null;
  onClose: () => void;
}

export function AgentExterneFormModal({ agent, onClose }: Props) {
  const { data: paysData } = usePays();
  const pays = paysData?.data ?? [];
  const createAgent = useCreateAgentExterne();
  const updateAgent = useUpdateAgentExterne();

  const [form, setForm] = useState({
    matricule: '',
    nom: '',
    prenom: '',
    typeAgent: 'DIPLOMATE' as TypeAgent,
    grade: 'CONSEILLER' as AgentGrade,
    sexe: 'M',
    fonction: '',
    acteDeNomination: '',
    dateNaissance: '',
    provinceOrigine: '' as ProvinceRDC | '',
    telephone: '',
    email: '',
    paysActuelId: '',
    biographie: '',
  });

  useEffect(() => {
    if (agent) {
      setForm({
        matricule: agent.matricule,
        nom: agent.nom,
        prenom: agent.prenom,
        typeAgent: agent.typeAgent,
        grade: agent.grade,
        sexe: agent.sexe ?? 'M',
        fonction: agent.fonction ?? '',
        acteDeNomination: agent.acteDeNomination ?? '',
        dateNaissance: agent.dateNaissance ? agent.dateNaissance.split('T')[0] : '',
        provinceOrigine: agent.provinceOrigine ?? '',
        telephone: agent.telephone ?? '',
        email: agent.email ?? '',
        paysActuelId: agent.paysActuelId ?? '',
        biographie: agent.biographie ?? '',
      });
    }
  }, [agent]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      provinceOrigine: form.provinceOrigine || undefined,
      paysActuelId: form.paysActuelId || undefined,
      dateNaissance: form.dateNaissance || undefined,
      email: form.email || undefined,
      telephone: form.telephone || undefined,
    };

    try {
      if (agent) {
        await updateAgent.mutateAsync({ id: agent.id, ...payload });
      } else {
        await createAgent.mutateAsync(payload);
      }
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error?.response?.data?.message ?? 'Erreur lors de la sauvegarde');
    }
  }

  const isLoading = createAgent.isPending || updateAgent.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 text-lg">
            {agent ? 'Modifier le membre du personnel' : 'Nouveau membre du personnel extérieur'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 grid grid-cols-2 gap-4">

            {/* Matricule */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Matricule *</label>
              <input name="matricule" value={form.matricule} onChange={handleChange} required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rdc-blue/30 focus:border-rdc-blue"
                placeholder="EXT-2024-001"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Type d'agent *</label>
              <select name="typeAgent" value={form.typeAgent} onChange={handleChange} required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rdc-blue/30 focus:border-rdc-blue bg-white">
                {(['DIPLOMATE', 'HORS_CADRE'] as TypeAgent[]).map((t) => (
                  <option key={t} value={t}>{TYPE_AGENT_LABELS[t]}</option>
                ))}
              </select>
            </div>

            {/* Prenom */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Prénom *</label>
              <input name="prenom" value={form.prenom} onChange={handleChange} required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rdc-blue/30 focus:border-rdc-blue"
              />
            </div>

            {/* Nom */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Nom *</label>
              <input name="nom" value={form.nom} onChange={handleChange} required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rdc-blue/30 focus:border-rdc-blue"
              />
            </div>

            {/* Grade */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Grade *</label>
              <select name="grade" value={form.grade} onChange={handleChange} required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rdc-blue/30 focus:border-rdc-blue bg-white">
                {GRADES.map((g) => (
                  <option key={g} value={g}>{AGENT_GRADE_LABELS[g]}</option>
                ))}
              </select>
            </div>

            {/* Sexe */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Sexe</label>
              <select name="sexe" value={form.sexe} onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rdc-blue/30 focus:border-rdc-blue bg-white">
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>

            {/* Fonction */}
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Fonction / Titre</label>
              <input name="fonction" value={form.fonction} onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rdc-blue/30 focus:border-rdc-blue"
                placeholder="Chef de Mission Diplomatique"
              />
            </div>

            {/* Acte nomination */}
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Acte de nomination</label>
              <input name="acteDeNomination" value={form.acteDeNomination} onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rdc-blue/30 focus:border-rdc-blue"
              />
            </div>

            {/* Province origine */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Province d'origine</label>
              <select name="provinceOrigine" value={form.provinceOrigine} onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rdc-blue/30 focus:border-rdc-blue bg-white">
                <option value="">— Sélectionner —</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>{PROVINCE_LABELS[p]}</option>
                ))}
              </select>
            </div>

            {/* Date naissance */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Date de naissance</label>
              <input name="dateNaissance" type="date" value={form.dateNaissance} onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rdc-blue/30 focus:border-rdc-blue"
              />
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Téléphone</label>
              <input name="telephone" value={form.telephone} onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rdc-blue/30 focus:border-rdc-blue"
                placeholder="+243..."
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rdc-blue/30 focus:border-rdc-blue"
              />
            </div>

            {/* Pays d'affectation */}
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Pays d'affectation actuel</label>
              <select name="paysActuelId" value={form.paysActuelId} onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rdc-blue/30 focus:border-rdc-blue bg-white">
                <option value="">— Non affecté —</option>
                {pays.map((p) => (
                  <option key={p.id} value={p.id}>{p.nom} ({p.codeIso}) · {p.region?.nom}</option>
                ))}
              </select>
            </div>

            {/* Biographie */}
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Biographie</label>
              <textarea name="biographie" value={form.biographie} onChange={handleChange} rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rdc-blue/30 focus:border-rdc-blue resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className={cn('px-6 py-4 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white')}>
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-rdc-blue text-white text-sm font-semibold rounded-lg hover:bg-rdc-blue-dark transition-colors disabled:opacity-60">
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {agent ? 'Enregistrer' : 'Créer le membre'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
