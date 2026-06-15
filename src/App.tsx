import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import NotificationToast from './components/NotificationToast';
import HomePage from './pages/HomePage';
import OrderDetailPage from './pages/OrderDetailPage';
import ExceptionPage from './pages/ExceptionPage';
import HistoryPage from './pages/HistoryPage';

export default function App() {
  const user = useAppStore((state) => state.user);
  const loadFromLocalStorage = useAppStore((state) => state.loadFromLocalStorage);
  const checkOnlineStatus = useAppStore((state) => state.checkOnlineStatus);

  useEffect(() => {
    loadFromLocalStorage();
    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);
    return () => {
      window.removeEventListener('online', checkOnlineStatus);
      window.removeEventListener('offline', checkOnlineStatus);
    };
  }, [loadFromLocalStorage, checkOnlineStatus]);

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/exceptions" element={<ExceptionPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
      <NotificationToast />
    </div>
  );
}
