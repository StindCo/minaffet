import { useState } from 'react';
import { X, Loader2, Calendar, MapPin } from 'lucide-react';
import { usePostes } from '../../hooks/usePostes';
import { usePays } from '../../hooks/usePays';
import { useCreateMutation } from '../../hooks/useMutations';

interface Props {
  agentId: string;
  agentNom: string;
  onClose: () => void;
}

export function MutationModal({ agentId, agentNom, onClose }: Props) {
  const { data: paysData } = usePays();
  const pays = paysData?.data ?? [];

  const [selectedPaysId, setSelectedPaysId] = useState('');
  const { data: postesData } = usePostes(selectedPaysId || undefined);
  const postes = postesData?.data ?? [];

  const createMutation = useCreateMutation(agentId);

  const [form, setForm] = useState({
    paysId: '',
    posteDiplomatiqueId: '',
    dateDebut: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Date de fin calculée automatiquement (+4 ans)
  const dateFin = form.dateDebut
    ? (() => {
        const d = new Date(form.dateDebut);
        d.setFullYear(d.getFullYear() + 4);
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
      })()
    : '—';

  function handlePaysChange(paysId: string) {
    setSelectedPaysId(paysId);
    setForm((prev) => ({ ...prev, paysId, posteDiplomatiqueId: '' }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        paysId: form.paysId || undefined,
        posteDiplomatiqueId: form.posteDiplomatiqueId || undefined,
        dateDebut: form.dateDebut,
        notes: form.notes || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error?.response?.data?.message ?? 'Erreur lors de la création de la mutation');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-800">Nouvelle mutation</h2>
            <p className="text-sm text-slate-400 mt-0.5">{agentNom}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Pays */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              <MapPin size={11} className="inline mr-1" />Pays d'affectation *
            </label>
            <select
              value={form.paysId}
              onChange={(e) => handlePaysChange(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rdc-blue/30 focus:border-rdc-blue bg-white"
            >
              <option value="">— Sélectionner un pays —</option>
              {pays.map((p) => (
                <option key={p.id} value={p.id}>{p.nom} · {p.region?.nom}</option>
              ))}
            </select>
          </div>

          {/* Poste diplomatique */}
          {selectedPaysId && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Poste diplomatique
              </label>
              <select
                value={form.posteDiplomatiqueId}
                onChange={(e) => setForm((p) => ({ ...p, posteDiplomatiqueId: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rdc-blue/30 focus:border-rdc-blue bg-white"
              >
                <option value="">— Sans poste spécifique —</option>
                {postes.map((p) => (
                  <option key={p.id} value={p.id}>{p.nom} ({p.type})</option>
                ))}
              </select>
            </div>
          )}

          {/* Date de début */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              <Calendar size={11} className="inline mr-1" />Date de début *
            </label>
            <input
              type="date"
              value={form.dateDebut}
              onChange={(e) => setForm((p) => ({ ...p, dateDebut: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rdc-blue/30 focus:border-rdc-blue"
            />
          </div>

          {/* Info automatique */}
          <div className="bg-rdc-blue/5 border border-rdc-blue/15 rounded-xl p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Durée du mandat</span>
              <span className="font-bold text-rdc-navy">4 ans</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1.5">
              <span className="text-slate-500">Date de fin prévue</span>
              <span className="font-semibold text-rdc-blue">{dateFin}</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              · Alert court terme : 6 mois avant la fin<br />
              · Validation requise par un administrateur pour officialiser la mutation
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              rows={3}
              placeholder="Observations, contexte de la mutation…"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rdc-blue/30 focus:border-rdc-blue resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={createMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-rdc-blue text-white text-sm font-semibold rounded-lg hover:bg-rdc-blue-dark transition-colors disabled:opacity-60">
              {createMutation.isPending && <Loader2 size={13} className="animate-spin" />}
              Créer la mutation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
