import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Stations } from './pages/Stations';
import { StationDetail } from './pages/StationDetail';
import { Faults } from './pages/Faults';
import { FaultDetail } from './pages/FaultDetail';
import { WorkOrders } from './pages/WorkOrders';
import { WorkOrderDetail } from './pages/WorkOrderDetail';
import { Orders } from './pages/Orders';
import { OrderDetail } from './pages/OrderDetail';
import { Complaints } from './pages/Complaints';
import { ComplaintDetail } from './pages/ComplaintDetail';
import { Settlements } from './pages/Settlements';
import { useAuthStore } from './store/authStore';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stations"
          element={
            <ProtectedRoute>
              <Stations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stations/:id"
          element={
            <ProtectedRoute>
              <StationDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faults"
          element={
            <ProtectedRoute>
              <Faults />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faults/:id"
          element={
            <ProtectedRoute>
              <FaultDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workorders"
          element={
            <ProtectedRoute>
              <WorkOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workorders/:id"
          element={
            <ProtectedRoute>
              <WorkOrderDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute>
              <OrderDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/complaints"
          element={
            <ProtectedRoute>
              <Complaints />
            </ProtectedRoute>
          }
        />
        <Route
          path="/complaints/:id"
          element={
            <ProtectedRoute>
              <ComplaintDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settlements"
          element={
            <ProtectedRoute>
              <Settlements />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
