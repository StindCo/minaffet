import { Link } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const PROFIL_LABELS = {
  LECTEUR: 'Lecteur',
  ENCODEUR: 'Encodeur',
  ADMIN: 'Administrateur',
};

export function AccesRefusePage() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center mx-auto mb-5">
          <ShieldX size={28} className="text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Accès refusé</h1>
        <p className="text-slate-500 text-sm mb-1">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </p>
        {user && (
          <p className="text-xs text-slate-400 mb-6">
            Votre profil actuel : <span className="font-semibold text-slate-600">{PROFIL_LABELS[user.profil]}</span>
          </p>
        )}
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <ArrowLeft size={15} />
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
