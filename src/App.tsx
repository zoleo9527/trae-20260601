import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Inspection from '@/pages/Inspection';
import InspectionDetail from '@/pages/InspectionDetail';
import EggRecords from '@/pages/EggRecords';
import EggRecordDetail from '@/pages/EggRecordDetail';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="inspection" element={<Inspection />} />
          <Route path="inspection/:id" element={<InspectionDetail />} />
          <Route path="egg-records" element={<EggRecords />} />
          <Route path="egg-records/:id" element={<EggRecordDetail />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
