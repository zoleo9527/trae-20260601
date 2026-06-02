import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Appointments } from './pages/Appointments';
import { Triage } from './pages/Triage';
import { Schedule } from './pages/Schedule';
import { Scales } from './pages/Scales';
import { RiskAlert } from './pages/RiskAlert';
import { useUserStore } from './store/useUserStore';
import type { UserRole } from './types';
import type { ReactNode } from 'react';

const roleRoutes: Record<string, string[]> = {
  reception: ['/dashboard', '/appointments', '/triage', '/schedule', '/scales'],
  counselor: ['/dashboard', '/appointments', '/schedule', '/scales', '/risk'],
  supervisor: ['/dashboard', '/risk'],
};

function RoleGuard({ children, path }: { children: ReactNode; path: string }) {
  const { currentUser } = useUserStore();
  const allowed = roleRoutes[currentUser.role] || [];
  if (!allowed.includes(path)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function GuardedRoute({ path, element }: { path: string; element: ReactNode }) {
  return (
    <RoleGuard path={path}>
      {element}
    </RoleGuard>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="appointments" element={<GuardedRoute path="/appointments" element={<Appointments />} />} />
          <Route path="triage" element={<GuardedRoute path="/triage" element={<Triage />} />} />
          <Route path="schedule" element={<GuardedRoute path="/schedule" element={<Schedule />} />} />
          <Route path="scales" element={<GuardedRoute path="/scales" element={<Scales />} />} />
          <Route path="risk" element={<GuardedRoute path="/risk" element={<RiskAlert />} />} />
        </Route>
      </Routes>
    </Router>
  );
}
