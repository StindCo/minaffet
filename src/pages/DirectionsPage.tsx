import { useState } from 'react';
import { Building2, Plus, Pencil, Trash2, X, Users, Briefcase, AlertCircle } from 'lucide-react';
import { useDirections, useCreateDirection, useUpdateDirection, useDeleteDirection } from '../hooks/useDirections';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';
import type { Direction } from '../types';

export function DirectionsPage() {
  const { data, isLoading } = useDirections();
  const createDir = useCreateDirection();
  const updateDir = useUpdateDirection();
  const deleteDir = useDeleteDirection();
  const { canWrite, isAdmin } = useAuthStore();

  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; direction?: Direction } | null>(null);

  const directions = data?.data ?? [];

  const handleDelete = (d: Direction) => {
    const n = (d._count?.missions ?? 0) + (d._count?.agents ?? 0);
    if (n > 0) {
      alert(`Cette direction est liée à ${d._count?.missions ?? 0} mission(s) et ${d._count?.agents ?? 0} agent(s). Retirez ces liens avant suppression.`);
      return;
    }
    if (!confirm(`Supprimer la direction « ${d.code} — ${d.nom} » ?`)) return;
    deleteDir.mutate(d.id, {
      onError: (err: unknown) => {
        const m = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        alert(m ?? 'Suppression impossible');
      },
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Directions</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Départements du ministère — utilisés pour les missions et les agents
          </p>
        </div>
        {canWrite() && (
          <button
            type="button"
            onClick={() => setModal({ mode: 'create' })}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-lg transition hover:opacity-90"
            style={{ backgroundColor: '#007FFF' }}
          >
            <Plus size={16} />
            Nouvelle direction
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="h-48 animate-pulse bg-slate-50" />
        ) : directions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <Building2 size={36} className="text-slate-300 mb-3" />
            <p className="text-slate-600 font-semibold">Aucune direction</p>
            <p className="text-sm text-slate-400 mt-1 max-w-md">
              Lancez le seed backend (<code className="text-xs bg-slate-100 px-1 rounded">npx prisma db seed</code>) ou créez une direction ci-dessous.
            </p>
            {canWrite() && (
              <button
                type="button"
                onClick={() => setModal({ mode: 'create' })}
                className="mt-4 text-sm font-medium text-blue-600 hover:underline"
              >
                + Créer une direction
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Nom</th>
                  <th className="px-5 py-3 hidden md:table-cell">Description</th>
                  <th className="px-5 py-3 text-center w-24">Agents</th>
                  <th className="px-5 py-3 text-center w-24">Missions</th>
                  {canWrite() && <th className="px-5 py-3 text-right w-28">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {directions.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {d.code}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-900">{d.nom}</td>
                    <td className="px-5 py-3.5 text-slate-500 max-w-md truncate hidden md:table-cell">
                      {d.description ?? '—'}
                    </td>
                    <td className="px-5 py-3.5 text-center text-slate-600">
                      <span className="inline-flex items-center gap-1 justify-center">
                        <Users size={13} className="text-slate-400" />
                        {d._count?.agents ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center text-slate-600">
                      <span className="inline-flex items-center gap-1 justify-center">
                        <Briefcase size={13} className="text-slate-400" />
                        {d._count?.missions ?? 0}
                      </span>
                    </td>
                    {canWrite() && (
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setModal({ mode: 'edit', direction: d })}
                            className="p-2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                            title="Modifier"
                          >
                            <Pencil size={15} />
                          </button>
                          {isAdmin() && (
                            <button
                              type="button"
                              onClick={() => handleDelete(d)}
                              disabled={deleteDir.isPending}
                              className="p-2 rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
                              title="Supprimer (admin)"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <DirectionModal
          mode={modal.mode}
          direction={modal.direction}
          onClose={() => setModal(null)}
          onSubmit={async (body) => {
            if (modal.mode === 'create') {
              await createDir.mutateAsync(body);
            } else if (modal.direction) {
              await updateDir.mutateAsync({ id: modal.direction.id, ...body });
            }
            setModal(null);
          }}
          isPending={createDir.isPending || updateDir.isPending}
        />
      )}
    </div>
  );
}

function DirectionModal({
  mode,
  direction,
  onClose,
  onSubmit,
  isPending,
}: {
  mode: 'create' | 'edit';
  direction?: Direction;
  onClose: () => void;
  onSubmit: (body: { code: string; nom: string; description?: string }) => Promise<void>;
  isPending: boolean;
}) {
  const [code, setCode] = useState(direction?.code ?? '');
  const [nom, setNom] = useState(direction?.nom ?? '');
  const [description, setDescription] = useState(direction?.description ?? '');
  const [error, setError] = useState('');

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await onSubmit({
        code: mode === 'edit' ? code : code.trim().toUpperCase(),
        nom: nom.trim(),
        description: description.trim() || undefined,
      });
    } catch (err: unknown) {
      const m = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(m ?? 'Erreur');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            {mode === 'create' ? 'Nouvelle direction' : 'Modifier la direction'}
          </h2>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handle} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Code *</label>
            <input
              value={code}
              onChange={(e) => setCode(mode === 'create' ? e.target.value.toUpperCase() : e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="ex: DAB"
              maxLength={20}
              required
              disabled={mode === 'edit'}
            />
            {mode === 'edit' && (
              <p className="text-[11px] text-slate-400 mt-1">Le code ne peut pas être modifié après création.</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nom *</label>
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="Intitulé officiel"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="Optionnel"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
              <AlertCircle size={14} />{error}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={cn('px-4 py-2 text-sm font-semibold text-white rounded-lg', isPending && 'opacity-60')}
              style={{ backgroundColor: '#007FFF' }}
            >
              {isPending ? 'Enregistrement…' : mode === 'create' ? 'Créer' : 'Mettre à jour'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
