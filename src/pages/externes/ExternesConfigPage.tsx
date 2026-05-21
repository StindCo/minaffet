import { useState } from 'react';
import { Settings, Globe, MapPin, Building2, Users, Plus, Pencil, Trash2, X, Save, Loader2, ChevronRight } from 'lucide-react';
import { useRegions, useCreateRegion, useUpdateRegion, useDeleteRegion } from '../../hooks/useRegions';
import { usePays, useCreatePays, useUpdatePays, useDeletePays } from '../../hooks/usePays';
import { usePostes, useCreatePoste, useUpdatePoste, useDeletePoste } from '../../hooks/usePostes';
import { useAgentsExternes } from '../../hooks/useAgentsExternes';
import { AgentExterneFormModal } from '../../components/externes/AgentExterneFormModal';
import type { AgentExterne, Region, Pays, PosteDiplomatique } from '../../types';
import { AGENT_GRADE_LABELS, getPhotoUrl, cn } from '../../lib/utils';
import { TYPE_AGENT_LABELS } from '../../types';
import { useAuthStore } from '../../store/authStore';

type Tab = 'agents' | 'regions' | 'pays' | 'postes' | 'utilisateurs';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'agents',      label: 'Personnel',           icon: <Users size={15} /> },
  { id: 'regions',     label: 'Zones / Régions',    icon: <Globe size={15} /> },
  { id: 'pays',        label: 'Pays',               icon: <MapPin size={15} /> },
  { id: 'postes',      label: 'Postes diplomatiques', icon: <Building2 size={15} /> },
  { id: 'utilisateurs', label: 'Utilisateurs',       icon: <Users size={15} /> },
];

// ── Helpers formulaires ───────────────────────────────────
function FormInput({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
      <input {...props} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rdc-blue/30 focus:border-rdc-blue" />
    </div>
  );
}

function FormSelect({ label, children, ...props }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
      <select {...props} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rdc-blue/30 focus:border-rdc-blue">
        {children}
      </select>
    </div>
  );
}

// ── Tab Agents ────────────────────────────────────────────
function TabAgents() {
  const { canWrite, canDelete } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [editAgent, setEditAgent] = useState<AgentExterne | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAgentsExternes({ search: search || undefined, page, limit: 15 });
  const agents = data?.data ?? [];
  const pagination = data?.pagination;

  function countryFlag(codeIso2?: string | null): string {
    if (!codeIso2 || codeIso2.length !== 2) return '🌐';
    const codePoints = [...codeIso2.toUpperCase()].map((c) => 0x1F1E6 + c.charCodeAt(0) - 65);
    return String.fromCodePoint(...codePoints);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Rechercher un membre du personnel…"
          className="flex-1 max-w-xs px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rdc-blue/30"
        />
        <div className="flex-1" />
        {canWrite() && (
          <button
            onClick={() => { setEditAgent(null); setShowModal(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-rdc-blue text-white text-sm font-semibold rounded-lg hover:bg-rdc-blue-dark transition-colors"
          >
            <Plus size={14} /> Nouveau membre
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <div className="animate-spin w-5 h-5 border-2 border-rdc-blue border-t-transparent rounded-full mr-2" />
            Chargement…
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Personnel</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Type</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Grade</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Pays actuel</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {agents.map((agent) => {
                const photo = getPhotoUrl(agent.photoUrl);
                return (
                  <tr key={agent.id} className="hover:bg-slate-50 group">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200">
                          {photo
                            ? <img src={photo} alt="" className="w-full h-full object-cover" />
                            : <span className="text-slate-400 text-xs font-bold">{agent.nom[0]}{agent.prenom[0]}</span>
                          }
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{agent.prenom} {agent.nom}</p>
                          <p className="text-xs text-slate-400">{agent.matricule}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        'text-xs font-semibold px-2 py-0.5 rounded-full border',
                        agent.typeAgent === 'DIPLOMATE'
                          ? 'bg-rdc-blue/10 text-rdc-blue border-rdc-blue/20'
                          : 'bg-violet-50 text-violet-700 border-violet-200'
                      )}>
                        {TYPE_AGENT_LABELS[agent.typeAgent]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs">{AGENT_GRADE_LABELS[agent.grade]}</td>
                    <td className="py-3 px-4">
                      {agent.paysActuel
                        ? <span className="flex items-center gap-1"><span>{countryFlag(agent.paysActuel.codeIso2)}</span><span className="text-sm text-slate-700">{agent.paysActuel.nom}</span></span>
                        : <span className="text-slate-300 text-xs italic">—</span>
                      }
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        {canWrite() && (
                          <button onClick={() => { setEditAgent(agent); setShowModal(true); }}
                            className="p-1.5 text-slate-400 hover:text-rdc-blue hover:bg-rdc-blue/5 rounded-lg transition-colors">
                            <Pencil size={13} />
                          </button>
                        )}
                        {canDelete() && (
                          <button className="p-1.5 text-slate-400 hover:text-rdc-red hover:bg-rdc-red/5 rounded-lg transition-colors">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-400">Page {pagination.page} / {pagination.totalPages} · {pagination.total} agents</p>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pagination.page <= 1}
                className="px-2.5 py-1 text-xs border border-slate-200 rounded-md disabled:opacity-40 hover:bg-white transition-colors">
                ← Préc.
              </button>
              <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={pagination.page >= pagination.totalPages}
                className="px-2.5 py-1 text-xs border border-slate-200 rounded-md disabled:opacity-40 hover:bg-white transition-colors">
                Suiv. →
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <AgentExterneFormModal
          agent={editAgent}
          onClose={() => { setShowModal(false); setEditAgent(null); }}
        />
      )}
    </div>
  );
}

// ── Tab Régions ───────────────────────────────────────────
function TabRegions() {
  const { data } = useRegions();
  const regions = data?.data ?? [];
  const createRegion = useCreateRegion();
  const updateRegion = useUpdateRegion();
  const deleteRegion = useDeleteRegion();

  const [editing, setEditing] = useState<Region | null>(null);
  const [form, setForm] = useState({ nom: '', code: '', description: '' });
  const [showForm, setShowForm] = useState(false);

  function openNew() { setEditing(null); setForm({ nom: '', code: '', description: '' }); setShowForm(true); }
  function openEdit(r: Region) { setEditing(r); setForm({ nom: r.nom, code: r.code, description: r.description ?? '' }); setShowForm(true); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editing) await updateRegion.mutateAsync({ id: editing.id, ...form });
      else await createRegion.mutateAsync(form);
      setShowForm(false);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error?.response?.data?.message ?? 'Erreur');
    }
  }

  async function handleDelete(r: Region) {
    if (!window.confirm(`Supprimer la région "${r.nom}" ?`)) return;
    try { await deleteRegion.mutateAsync(r.id); }
    catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error?.response?.data?.message ?? 'Erreur');
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 bg-rdc-blue text-white text-sm font-semibold rounded-lg hover:bg-rdc-blue-dark transition-colors">
          <Plus size={14} /> Nouvelle région
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {regions.map((r) => (
          <div key={r.id} className="bg-white border border-slate-100 rounded-xl p-4 flex items-start justify-between group">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-rdc-navy text-white text-[10px] font-bold rounded">{r.code}</span>
                <p className="font-semibold text-slate-800">{r.nom}</p>
              </div>
              <p className="text-xs text-slate-400">{r._count?.pays ?? 0} pays</p>
              {r.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{r.description}</p>}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openEdit(r)} className="p-1.5 text-slate-400 hover:text-rdc-blue hover:bg-rdc-blue/5 rounded-lg transition-colors"><Pencil size={12} /></button>
              <button onClick={() => handleDelete(r)} className="p-1.5 text-slate-400 hover:text-rdc-red hover:bg-rdc-red/5 rounded-lg transition-colors"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">{editing ? 'Modifier la région' : 'Nouvelle région'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormInput label="Nom *" value={form.nom} onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))} required placeholder="Afrique subsaharienne" />
                <FormInput label="Code *" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} required placeholder="AFR" maxLength={10} />
              </div>
              <FormInput label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
                <button type="submit" disabled={createRegion.isPending || updateRegion.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-rdc-blue text-white text-sm font-semibold rounded-lg hover:bg-rdc-blue-dark disabled:opacity-60">
                  {(createRegion.isPending || updateRegion.isPending) ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab Pays ──────────────────────────────────────────────
function TabPays() {
  const { data: regionsData } = useRegions();
  const regions = regionsData?.data ?? [];
  const { data: paysData } = usePays();
  const pays = paysData?.data ?? [];
  const createPays = useCreatePays();
  const updatePays = useUpdatePays();
  const deletePays = useDeletePays();

  const [editing, setEditing] = useState<Pays | null>(null);
  const [form, setForm] = useState({ nom: '', codeIso: '', codeIso2: '', regionId: '' });
  const [showForm, setShowForm] = useState(false);

  function openNew() { setEditing(null); setForm({ nom: '', codeIso: '', codeIso2: '', regionId: '' }); setShowForm(true); }
  function openEdit(p: Pays) { setEditing(p); setForm({ nom: p.nom, codeIso: p.codeIso, codeIso2: p.codeIso2 ?? '', regionId: p.regionId }); setShowForm(true); }

  function countryFlag(codeIso2?: string | null): string {
    if (!codeIso2 || codeIso2.length !== 2) return '🌐';
    const codePoints = [...codeIso2.toUpperCase()].map((c) => 0x1F1E6 + c.charCodeAt(0) - 65);
    return String.fromCodePoint(...codePoints);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editing) await updatePays.mutateAsync({ id: editing.id, ...form });
      else await createPays.mutateAsync({ nom: form.nom, codeIso: form.codeIso, codeIso2: form.codeIso2 || undefined, regionId: form.regionId });
      setShowForm(false);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error?.response?.data?.message ?? 'Erreur');
    }
  }

  async function handleDelete(p: Pays) {
    if (!window.confirm(`Supprimer "${p.nom}" ?`)) return;
    try { await deletePays.mutateAsync(p.id); }
    catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error?.response?.data?.message ?? 'Erreur');
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 bg-rdc-blue text-white text-sm font-semibold rounded-lg hover:bg-rdc-blue-dark transition-colors">
          <Plus size={14} /> Nouveau pays
        </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Pays</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">ISO</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Région</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Agents</th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {pays.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 group">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{countryFlag(p.codeIso2)}</span>
                    <span className="font-medium text-slate-800">{p.nom}</span>
                  </div>
                </td>
                <td className="py-3 px-4"><span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{p.codeIso}</span></td>
                <td className="py-3 px-4 text-slate-500 text-xs">{p.region?.nom ?? '—'}</td>
                <td className="py-3 px-4 text-slate-500 text-xs">{p._count?.agentsActuels ?? 0}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(p)} className="p-1.5 text-slate-400 hover:text-rdc-blue hover:bg-rdc-blue/5 rounded-lg transition-colors"><Pencil size={12} /></button>
                    <button onClick={() => handleDelete(p)} className="p-1.5 text-slate-400 hover:text-rdc-red hover:bg-rdc-red/5 rounded-lg transition-colors"><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">{editing ? 'Modifier le pays' : 'Nouveau pays'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <FormInput label="Nom *" value={form.nom} onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))} required />
              <div className="grid grid-cols-2 gap-3">
                <FormInput label="Code ISO-3 *" value={form.codeIso} onChange={(e) => setForm((p) => ({ ...p, codeIso: e.target.value }))} required maxLength={3} placeholder="FRA" />
                <FormInput label="Code ISO-2" value={form.codeIso2} onChange={(e) => setForm((p) => ({ ...p, codeIso2: e.target.value }))} maxLength={2} placeholder="FR" />
              </div>
              <FormSelect label="Région *" value={form.regionId} onChange={(e) => setForm((p) => ({ ...p, regionId: e.target.value }))} required>
                <option value="">— Sélectionner —</option>
                {regions.map((r) => <option key={r.id} value={r.id}>{r.nom}</option>)}
              </FormSelect>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
                <button type="submit" disabled={createPays.isPending || updatePays.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-rdc-blue text-white text-sm font-semibold rounded-lg hover:bg-rdc-blue-dark disabled:opacity-60">
                  {(createPays.isPending || updatePays.isPending) ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab Postes Diplomatiques ──────────────────────────────
function TabPostes() {
  const { data: paysData } = usePays();
  const pays = paysData?.data ?? [];
  const { data: postesData } = usePostes();
  const postes = postesData?.data ?? [];
  const createPoste = useCreatePoste();
  const updatePoste = useUpdatePoste();
  const deletePoste = useDeletePoste();

  const [editing, setEditing] = useState<PosteDiplomatique | null>(null);
  const [form, setForm] = useState({ nom: '', type: 'Ambassade', ville: '', paysId: '' });
  const [showForm, setShowForm] = useState(false);

  function openNew() { setEditing(null); setForm({ nom: '', type: 'Ambassade', ville: '', paysId: '' }); setShowForm(true); }
  function openEdit(p: PosteDiplomatique) { setEditing(p); setForm({ nom: p.nom, type: p.type, ville: p.ville, paysId: p.paysId }); setShowForm(true); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editing) await updatePoste.mutateAsync({ id: editing.id, ...form });
      else await createPoste.mutateAsync(form);
      setShowForm(false);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error?.response?.data?.message ?? 'Erreur');
    }
  }

  async function handleDelete(p: PosteDiplomatique) {
    if (!window.confirm(`Supprimer "${p.nom}" ?`)) return;
    try { await deletePoste.mutateAsync(p.id); }
    catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error?.response?.data?.message ?? 'Erreur');
    }
  }

  const TYPES = ['Ambassade', 'Consulat', 'Mission permanente', 'Haut-Commissariat', 'Représentation', 'Bureau de liaison'];

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 bg-rdc-blue text-white text-sm font-semibold rounded-lg hover:bg-rdc-blue-dark transition-colors">
          <Plus size={14} /> Nouveau poste
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {postes.map((p) => (
          <div key={p.id} className="bg-white border border-slate-100 rounded-xl p-4 flex items-start justify-between group">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded">{p.type}</span>
              </div>
              <p className="font-semibold text-slate-800 text-sm">{p.nom}</p>
              <p className="text-xs text-slate-400 mt-0.5">{p.ville} · {p.pays?.nom}</p>
              <p className="text-xs text-slate-300">{p._count?.mutations ?? 0} mutation(s)</p>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openEdit(p)} className="p-1.5 text-slate-400 hover:text-rdc-blue hover:bg-rdc-blue/5 rounded-lg transition-colors"><Pencil size={12} /></button>
              <button onClick={() => handleDelete(p)} className="p-1.5 text-slate-400 hover:text-rdc-red hover:bg-rdc-red/5 rounded-lg transition-colors"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">{editing ? 'Modifier le poste' : 'Nouveau poste diplomatique'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <FormInput label="Nom du poste *" value={form.nom} onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))} required placeholder="Ambassade de la RDC à Paris" />
              <FormSelect label="Type *" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} required>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </FormSelect>
              <FormInput label="Ville *" value={form.ville} onChange={(e) => setForm((p) => ({ ...p, ville: e.target.value }))} required />
              <FormSelect label="Pays *" value={form.paysId} onChange={(e) => setForm((p) => ({ ...p, paysId: e.target.value }))} required>
                <option value="">— Sélectionner —</option>
                {pays.map((p) => <option key={p.id} value={p.id}>{p.nom} ({p.codeIso})</option>)}
              </FormSelect>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
                <button type="submit" disabled={createPoste.isPending || updatePoste.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-rdc-blue text-white text-sm font-semibold rounded-lg hover:bg-rdc-blue-dark disabled:opacity-60">
                  {(createPoste.isPending || updatePoste.isPending) ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page principale Config ────────────────────────────────
export function ExternesConfigPage() {
  const [activeTab, setActiveTab] = useState<Tab>('agents');

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-6">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-rdc-navy flex items-center justify-center">
          <Settings size={18} className="text-white" />
        </div>
        <div>
          <h1 className="font-extrabold text-slate-800 text-xl">Configuration</h1>
          <p className="text-slate-400 text-sm">Gérez les référentiels et données du module extérieur</p>
        </div>
      </div>

      <div className="flex gap-6">

        {/* Sidebar tabs */}
        <nav className="w-52 shrink-0 space-y-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-rdc-navy text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              )}
            >
              <div className="flex items-center gap-2.5">
                {tab.icon}
                {tab.label}
              </div>
              {activeTab === tab.id && <ChevronRight size={13} className="opacity-60" />}
            </button>
          ))}
        </nav>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          {activeTab === 'agents'      && <TabAgents />}
          {activeTab === 'regions'     && <TabRegions />}
          {activeTab === 'pays'        && <TabPays />}
          {activeTab === 'postes'      && <TabPostes />}
          {activeTab === 'utilisateurs' && (
            <div className="bg-white border border-slate-100 rounded-xl p-8 text-center text-slate-400">
              <Users size={36} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium text-sm">Gestion des utilisateurs</p>
              <p className="text-xs mt-1">Intégrée depuis la route <code>/utilisateurs</code></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
