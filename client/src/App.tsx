import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import OrdersPage from '@/pages/OrdersPage';
import CheckinsPage from '@/pages/CheckinsPage';
import ExceptionsPage from '@/pages/ExceptionsPage';
import ReplenishmentsPage from '@/pages/ReplenishmentsPage';
import OrderDetail from '@/pages/OrderDetail';
import CheckinDetail from '@/pages/CheckinDetail';

const roleMap: Record<string, string> = {
  clerk: '站点文员',
  courier: '配送员',
  customer_service: '客服',
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🥛 乳品配送站 - 晨配签到与异常补送</h1>
        {user && (
          <div className="user-info">
            <span className="user-role">{roleMap[user.role]}</span>
            <span>{user.name}</span>
            <button className="logout-btn" onClick={handleLogout}>
              退出
            </button>
          </div>
        )}
      </header>
      <div className="container">{children}</div>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <Layout>
              <OrdersPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <OrderDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkins"
        element={
          <ProtectedRoute>
            <Layout>
              <CheckinsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkins/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <CheckinDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/exceptions"
        element={
          <ProtectedRoute>
            <Layout>
              <ExceptionsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/replenishments"
        element={
          <ProtectedRoute>
            <Layout>
              <ReplenishmentsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;
