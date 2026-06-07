import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import InspectionList from './pages/InspectionList';
import InspectionDetail from './pages/InspectionDetail';
import InspectionCreate from './pages/InspectionCreate';
import RepairList from './pages/RepairList';
import RepairDetail from './pages/RepairDetail';
import RepairCreate from './pages/RepairCreate';
import MachineList from './pages/MachineList';
import NotificationList from './pages/NotificationList';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inspections" element={<InspectionList />} />
        <Route path="/inspections/new" element={<InspectionCreate />} />
        <Route path="/inspections/:id" element={<InspectionDetail />} />
        <Route path="/repairs" element={<RepairList />} />
        <Route path="/repairs/new" element={<RepairCreate />} />
        <Route path="/repairs/:id" element={<RepairDetail />} />
        <Route path="/machines" element={<MachineList />} />
        <Route path="/notifications" element={<NotificationList />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

export default App;
