import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import LoginPage from './pages/Login/LoginPage.jsx';
import Layout from './components/layout/Layout.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import DelegationList from './pages/Delegation/DelegationList.jsx';
import DelegationDetail from './pages/Delegation/DelegationDetail.jsx';
import DelegationCreate from './pages/Delegation/DelegationCreate.jsx';
import AuditLogs from './pages/Audit/AuditLogs.jsx';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="delegations" element={<DelegationList />} />
            <Route path="delegations/create" element={<DelegationCreate />} />
            <Route path="delegations/:id" element={<DelegationDetail />} />
            <Route path="audit-logs" element={<AuditLogs />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
