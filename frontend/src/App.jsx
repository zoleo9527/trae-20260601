import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import LoginPage from './pages/Login/LoginPage.jsx';
import Layout from './components/layout/Layout.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import DelegationList from './pages/Delegation/DelegationList.jsx';
import DelegationDetail from './pages/Delegation/DelegationDetail.jsx';
import DelegationCreate from './pages/Delegation/DelegationCreate.jsx';
import AuditLogs from './pages/Audit/AuditLogs.jsx';
import { authService } from './services/authService.js';

function PrivateRoute({ children }) {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      const token = authService.getToken();
      if (!token) {
        setIsValid(false);
        setIsValidating(false);
        return;
      }

      try {
        const isValidToken = await authService.verifyToken();
        setIsValid(isValidToken);
      } catch (error) {
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, []);

  if (isValidating) {
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>验证中...</div>;
  }

  return isValid ? children : <Navigate to="/login" />;
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
