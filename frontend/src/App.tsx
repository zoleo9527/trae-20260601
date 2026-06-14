import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import TransferFlow from './pages/TransferFlow';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

      <Route
        path="/purchaseManager"
        element={<AppLayout role="purchaseManager" />}
      >
        <Route index element={<Dashboard role="purchaseManager" />} />
        <Route path="transfer" element={<TransferFlow role="purchaseManager" />} />
      </Route>

      <Route
        path="/appraiser"
        element={<AppLayout role="appraiser" />}
      >
        <Route index element={<Dashboard role="appraiser" />} />
        <Route path="transfer" element={<TransferFlow role="appraiser" />} />
      </Route>

      <Route
        path="/financeSpecialist"
        element={<AppLayout role="financeSpecialist" />}
      >
        <Route index element={<Dashboard role="financeSpecialist" />} />
        <Route path="transfer" element={<TransferFlow role="financeSpecialist" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
