import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Login from './pages/Login';
import Layout from './pages/Layout';
import Dashboard from './pages/Dashboard';
import CarList from './pages/CarList';
import CarDetail from './pages/CarDetail';
import LogList from './pages/LogList';
import { authApi } from './api';
import { AuthTokenPayload } from './types';

function App() {
  const [user, setUser] = useState<AuthTokenPayload | null>(authApi.me());

  useEffect(() => {
    const handler = () => setUser(authApi.me());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={(u) => setUser(u)} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout user={user} onLogout={() => { authApi.logout(); setUser(null); }} />}>
        <Route index element={<Dashboard user={user} />} />
        <Route path="cars" element={<CarList user={user} />} />
        <Route path="cars/:id" element={<CarDetail user={user} />} />
        <Route path="logs" element={<LogList />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
      <Route path="/login" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
