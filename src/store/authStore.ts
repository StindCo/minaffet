import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';

export type ProfilRole = 'LECTEUR' | 'ENCODEUR' | 'ADMIN';

export interface AuthUser {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  profil: ProfilRole;
  agentLie?: {
    id: string;
    nom: string;
    prenom: string;
    grade: string;
    photoUrl?: string;
  } | null;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;

  login: (email: string, motDePasse: string) => Promise<void>;
  logout: () => void;

  // Guards utilitaires
  isAdmin: () => boolean;
  isEncodeur: () => boolean;
  canWrite: () => boolean;
  canDelete: () => boolean;
  canManageUsers: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, motDePasse: string) => {
        const res = await api.post('/auth/login', { email, motDePasse });
        const { token, user } = res.data.data;

        // Injecter le token dans l'intercepteur Axios
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        delete api.defaults.headers.common['Authorization'];
        set({ user: null, token: null, isAuthenticated: false });
      },

      isAdmin: () => get().user?.profil === 'ADMIN',
      isEncodeur: () => get().user?.profil === 'ENCODEUR',

      // ENCODEUR et ADMIN peuvent créer/modifier
      canWrite: () => {
        const p = get().user?.profil;
        return p === 'ENCODEUR' || p === 'ADMIN';
      },

      // ADMIN uniquement peut supprimer
      canDelete: () => get().user?.profil === 'ADMIN',

      // ADMIN uniquement gère les comptes
      canManageUsers: () => get().user?.profil === 'ADMIN',
    }),
    {
      name: 'minaffet-auth',
      // Ne persister que le token et l'user (pas les fonctions)
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
      // Restaurer le token dans Axios au démarrage
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
        }
      },
    }
  )
);
