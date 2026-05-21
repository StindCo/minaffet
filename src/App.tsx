import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { ExternesLayout } from './components/layout/ExternesLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { AccesRefusePage } from './pages/AccesRefusePage';
import { WorkspacePage } from './pages/WorkspacePage';
// ── Module interne (legacy) ────────────────────────────────
import { DashboardPage } from './pages/DashboardPage';
import { MissionsPage } from './pages/MissionsPage';
import { NewMissionPage } from './pages/NewMissionPage';
import { MissionDetailPage } from './pages/MissionDetailPage';
import { AgentsPage } from './pages/AgentsPage';
import { AgentDetailPage } from './pages/AgentDetailPage';
import { TrackerPage } from './pages/TrackerPage';
import { CalendarPage } from './pages/CalendarPage';
import { UsersPage } from './pages/UsersPage';
import { DirectionsPage } from './pages/DirectionsPage';
// ── Module agents extérieurs ───────────────────────────────
import { ExternesMainPage } from './pages/externes/ExternesMainPage';
import { ExternesConfigPage } from './pages/externes/ExternesConfigPage';
import { AgentExterneDetailPage } from './pages/externes/AgentExterneDetailPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* ── Publiques ─────────────────────────────── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/acces-refuse" element={<AccesRefusePage />} />

          {/* ── Protégées ─────────────────────────────── */}
          <Route element={<ProtectedRoute />}>

            {/* Workspace switcher — point d'entrée après login */}
            <Route path="/" element={<WorkspacePage />} />

            {/* ── Module Agents Extérieurs ─────────────── */}
            <Route element={<ExternesLayout />}>
              <Route path="/externes" element={<ExternesMainPage />} />
              <Route path="/externes/agents/:id" element={<AgentExterneDetailPage />} />
              <Route element={<ProtectedRoute profils={['ENCODEUR', 'ADMIN']} />}>
                <Route path="/externes/configuration" element={<ExternesConfigPage />} />
              </Route>
            </Route>

            {/* ── Module Interne (legacy) ──────────────── */}
            <Route element={<AppLayout />}>
              <Route path="/internes" element={<DashboardPage />} />

              <Route path="/missions" element={<MissionsPage />} />
              <Route element={<ProtectedRoute profils={['ENCODEUR', 'ADMIN']} />}>
                <Route path="/missions/new" element={<NewMissionPage />} />
              </Route>
              <Route path="/missions/:id" element={<MissionDetailPage />} />

              <Route path="/agents" element={<AgentsPage />} />
              <Route path="/agents/:id" element={<AgentDetailPage />} />
              <Route path="/tracker" element={<TrackerPage />} />
              <Route path="/calendrier" element={<CalendarPage />} />
              <Route path="/directions" element={<DirectionsPage />} />

              <Route element={<ProtectedRoute profils={['ADMIN']} />}>
                <Route path="/utilisateurs" element={<UsersPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
