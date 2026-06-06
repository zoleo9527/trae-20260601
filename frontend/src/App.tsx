import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, getRoleHomePath } from './store/auth';
import Login from './pages/Login';
import DispatcherLayout from './pages/dispatcher/Layout';
import ForkmanLayout from './pages/forkman/Layout';
import ClerkLayout from './pages/clerk/Layout';
import AppointmentDetail from './pages/AppointmentDetail';

const AppContent: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to={getRoleHomePath(user.role)} replace />} />
      <Route path="/dispatcher/*" element={<DispatcherLayout />} />
      <Route path="/forkman/*" element={<ForkmanLayout />} />
      <Route path="/clerk/*" element={<ClerkLayout />} />
      <Route path="/appointment/:id" element={<AppointmentDetail />} />
      <Route path="*" element={<Navigate to={getRoleHomePath(user.role)} replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
