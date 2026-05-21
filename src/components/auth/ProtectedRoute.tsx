import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore, type ProfilRole } from '../../store/authStore';

interface ProtectedRouteProps {
  /** Si fourni, seuls ces profils peuvent accéder. Sinon, tout utilisateur connecté passe. */
  profils?: ProfilRole[];
  /** Redirection si non autorisé (défaut : '/login') */
  redirectTo?: string;
}

/**
 * Protège une route par authentification et optionnellement par profil.
 *
 * Usage :
 *   <Route element={<ProtectedRoute />}>              ← tout utilisateur connecté
 *   <Route element={<ProtectedRoute profils={['ADMIN']} />}>   ← admin seulement
 */
export function ProtectedRoute({ profils, redirectTo = '/login' }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  // Non connecté → page de login
  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Profil insuffisant → page d'accès refusé
  if (profils && !profils.includes(user.profil)) {
    return <Navigate to="/acces-refuse" replace />;
  }

  return <Outlet />;
}
