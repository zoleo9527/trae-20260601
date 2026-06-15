import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import OrderList from '@/pages/OrderList';
import OrderDetail from '@/pages/OrderDetail';
import TireSelection from '@/pages/TireSelection';
import QuoteConfirm from '@/pages/QuoteConfirm';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/orders" element={<OrderList />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/orders/:id/selection" element={<TireSelection />} />
          <Route path="/orders/:id/quote" element={<QuoteConfirm />} />
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
