import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import OrderList from '@/pages/OrderList';
import OrderDetail from '@/pages/OrderDetail';
import TireSelection from '@/pages/TireSelection';
import QuoteConfirm from '@/pages/QuoteConfirm';
import { useAuthStore } from '@/store/authStore';
import { ROLE_DEFAULT_ENTRY } from '@shared/types';

function RoleBasedLanding() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_DEFAULT_ENTRY[user.role].path} replace />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<AppLayout />}>
          <Route index element={<RoleBasedLanding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/orders" element={<OrderList />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/orders/:id/selection" element={<TireSelection />} />
          <Route path="/orders/:id/quote" element={<QuoteConfirm />} />
        </Route>
        <Route path="/" element={<RoleBasedLanding />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
