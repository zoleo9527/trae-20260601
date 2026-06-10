import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InspectionsPage from './pages/InspectionsPage';
import EggRecordsPage from './pages/EggRecordsPage';
import ExceptionsPage from './pages/ExceptionsPage';
import EggHistoryPage from './pages/EggHistoryPage';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="inspections" element={<InspectionsPage />} />
        <Route path="egg-records" element={<EggRecordsPage />} />
        <Route path="egg-records/history" element={<EggHistoryPage />} />
        <Route path="exceptions" element={<ExceptionsPage />} />
      </Route>
    </Routes>
  );
}
