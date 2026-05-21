import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserPlus,
  Shield,
  ShieldCheck,
  Eye,
  PenSquare,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Crown,
  X,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore, type ProfilRole } from '../store/authStore';
import { formatDate, cn } from '../lib/utils';

// ── Types ──────────────────────────────────────────────────
interface AppUser {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  profil: ProfilRole;
  actif: boolean;
  creePar?: string;
  derniereConnexion?: string;
  createdAt: string;
  agentLie?: { id: string; nom: string; prenom: string; grade: string } | null;
}

// ── Labels & styles ────────────────────────────────────────
const PROFIL_CONFIG: Record<ProfilRole, { label: string; icon: React.ReactNode; className: string; description: string }> = {
  ADMIN: {
    label: 'Administrateur',
    icon: <Crown size={13} className="text-violet-400" />,
    className: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    description: 'Tous les droits : suppression, gestion des comptes',
  },
  ENCODEUR: {
    label: 'Encodeur',
    icon: <PenSquare size={13} className="text-blue-400" />,
    className: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    description: 'Peut enregistrer et modifier les informations',
  },
  LECTEUR: {
    label: 'Lecteur',
    icon: <Eye size={13} className="text-slate-400" />,
    className: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    description: 'Consultation uniquement',
  },
};

// ── Hook API ───────────────────────────────────────────────
function useUsers() {
  return useQuery<{ success: boolean; data: AppUser[] }>({
    queryKey: ['users'],
    queryFn: () => api.get('/auth/users').then((r) => r.data),
  });
}

// ── Composant principal ────────────────────────────────────
export function UsersPage() {
  const { user: moi } = useAuthStore();
  const { data, isLoading } = useUsers();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const users = data?.data ?? [];

  const toggleActif = useMutation({
    mutationFn: ({ id, actif }: { id: string; actif: boolean }) =>
      api.patch(`/auth/users/${id}`, { actif }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => api.delete(`/auth/users/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const handleDelete = (user: AppUser) => {
    if (confirm(`Supprimer le compte de ${user.prenom} ${user.nom} ? Cette action est irréversible.`)) {
      deleteUser.mutate(user.id);
    }
  };

  const grouped = {
    ADMIN: users.filter((u) => u.profil === 'ADMIN'),
    ENCODEUR: users.filter((u) => u.profil === 'ENCODEUR'),
    LECTEUR: users.filter((u) => u.profil === 'LECTEUR'),
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Gestion des utilisateurs</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Gérez les comptes et les profils d'accès à la plateforme.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <UserPlus size={15} />
          Ouvrir un compte
        </button>
      </div>

      {/* Résumé des profils */}
      <div className="grid grid-cols-3 gap-3">
        {(['ADMIN', 'ENCODEUR', 'LECTEUR'] as ProfilRole[]).map((profil) => {
          const cfg = PROFIL_CONFIG[profil];
          return (
            <div key={profil} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border', cfg.className)}>
                  {cfg.icon}{cfg.label}
                </span>
                <span className="ml-auto text-lg font-bold text-slate-800">{grouped[profil].length}</span>
              </div>
              <p className="text-xs text-slate-500">{cfg.description}</p>
            </div>
          );
        })}
      </div>

      {/* Liste par groupe */}
      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 h-16" />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {(['ADMIN', 'ENCODEUR', 'LECTEUR'] as ProfilRole[]).map((profil) => {
            const cfg = PROFIL_CONFIG[profil];
            const liste = grouped[profil];
            if (liste.length === 0) return null;

            return (
              <div key={profil}>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  {cfg.icon}
                  {cfg.label}s ({liste.length})
                </h3>
                <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                  {liste.map((u) => (
                    <UserRow
                      key={u.id}
                      user={u}
                      isMe={u.id === moi?.id}
                      profilConfig={cfg}
                      onToggleActif={() => toggleActif.mutate({ id: u.id, actif: !u.actif })}
                      onDelete={() => handleDelete(u)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modale de création */}
      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

// ── Ligne utilisateur ──────────────────────────────────────
function UserRow({
  user,
  isMe,
  profilConfig,
  onToggleActif,
  onDelete,
}: {
  user: AppUser;
  isMe: boolean;
  profilConfig: (typeof PROFIL_CONFIG)[ProfilRole];
  onToggleActif: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={cn('flex items-center gap-3 px-5 py-3.5', !user.actif && 'opacity-50')}>
      {/* Avatar */}
      <div className={cn(
        'w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold',
        user.actif ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-500'
      )}>
        {user.nom[0]}{user.prenom[0]}
      </div>

      {/* Infos */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {user.prenom} {user.nom}
            {isMe && <span className="ml-1.5 text-xs text-blue-500 font-normal">(vous)</span>}
          </p>
          {!user.actif && (
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Désactivé</span>
          )}
        </div>
        <p className="text-xs text-slate-500 truncate">{user.email}</p>
        {user.agentLie && (
          <p className="text-xs text-slate-400 mt-0.5">
            Agent lié : {user.agentLie.prenom} {user.agentLie.nom}
          </p>
        )}
      </div>

      {/* Dernière connexion */}
      <div className="hidden md:block text-xs text-slate-400 text-right shrink-0">
        {user.derniereConnexion
          ? <><p className="text-slate-500">Dernière connexion</p><p>{formatDate(user.derniereConnexion)}</p></>
          : <p>Jamais connecté</p>
        }
      </div>

      {/* Actions */}
      {!isMe && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onToggleActif}
            title={user.actif ? 'Désactiver le compte' : 'Activer le compte'}
            className={cn(
              'p-2 rounded-lg transition-colors',
              user.actif
                ? 'text-emerald-500 hover:bg-emerald-50'
                : 'text-slate-400 hover:bg-slate-100'
            )}
          >
            {user.actif ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
          </button>
          <button
            onClick={onDelete}
            title="Supprimer ce compte"
            className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Modale de création d'un compte ────────────────────────
function CreateUserModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    profil: 'LECTEUR' as ProfilRole,
  });
  const [erreur, setErreur] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur('');
    setLoading(true);

    try {
      await api.post('/auth/users', form);
      qc.invalidateQueries({ queryKey: ['users'] });
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setErreur(axiosErr.response?.data?.message || 'Erreur lors de la création du compte.');
    } finally {
      setLoading(false);
    }
  };

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <UserPlus size={18} className="text-blue-500" />
            Ouvrir un nouveau compte
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Sélection du profil en premier — choix stratégique */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Profil d'accès *</label>
            <div className="grid grid-cols-3 gap-2">
              {(['LECTEUR', 'ENCODEUR', 'ADMIN'] as ProfilRole[]).map((p) => {
                const cfg = PROFIL_CONFIG[p];
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => set('profil', p)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-medium transition-all',
                      form.profil === p
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    )}
                  >
                    <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px]', cfg.className)}>
                      {cfg.icon}{cfg.label}
                    </span>
                    <span className="text-[10px] text-slate-500 text-center leading-tight">{cfg.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nom / Prénom */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Prénom *</label>
              <input
                value={form.prenom}
                onChange={(e) => set('prenom', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Nom *</label>
              <input
                value={form.nom}
                onChange={(e) => set('nom', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="prenom.nom@minaffet.cd"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Mot de passe initial *</label>
            <input
              type="text"
              value={form.motDePasse}
              onChange={(e) => set('motDePasse', e.target.value)}
              placeholder="Min. 8 caractères"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              required
              minLength={8}
            />
            <p className="text-xs text-slate-400 mt-1">L'utilisateur pourra changer son mot de passe après connexion.</p>
          </div>

          {erreur && (
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">{erreur}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              {loading ? 'Création...' : 'Créer le compte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
