import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import LoginPage from './pages/LoginPage';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import PropertyList from './pages/PropertyList';
import PropertyDetail from './pages/PropertyDetail';
import ViewingList from './pages/ViewingList';
import ViewingDetail from './pages/ViewingDetail';
import QuotationList from './pages/QuotationList';
import QuotationDetail from './pages/QuotationDetail';
import ContractList from './pages/ContractList';
import ContractDetail from './pages/ContractDetail';
import HandoverList from './pages/HandoverList';
import HandoverDetail from './pages/HandoverDetail';
import DepositList from './pages/DepositList';
import DepositDetail from './pages/DepositDetail';
import OperationLogs from './pages/OperationLogs';

function App() {
  const { checkAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="properties" element={<PropertyList />} />
        <Route path="properties/:id" element={<PropertyDetail />} />
        <Route path="viewings" element={<ViewingList />} />
        <Route path="viewings/:id" element={<ViewingDetail />} />
        <Route path="quotations" element={<QuotationList />} />
        <Route path="quotations/:id" element={<QuotationDetail />} />
        <Route path="contracts" element={<ContractList />} />
        <Route path="contracts/:id" element={<ContractDetail />} />
        <Route path="handover" element={<HandoverList />} />
        <Route path="handover/:id" element={<HandoverDetail />} />
        <Route path="deposits" element={<DepositList />} />
        <Route path="deposits/:id" element={<DepositDetail />} />
        <Route path="logs" element={<OperationLogs />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
