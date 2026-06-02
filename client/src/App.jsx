import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { ordersApi } from './api';
import Sidebar from './components/Sidebar';
import Broadcast from './pages/Broadcast';
import Dashboard from './pages/Dashboard';
import Materials from './pages/Materials';
import OrderDetail from './pages/OrderDetail';
import Orders from './pages/Orders';
import Schedule from './pages/Schedule';

function DashboardWrapper() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await ordersApi.stats();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (label) => {
    if (label === '排期冲突') navigate('/schedule');
    else if (label === '待审核素材') navigate('/materials');
    else if (label === '已播待确认') navigate('/broadcast');
    else navigate('/orders');
  };

  if (loading) return <div className="text-center py-20 text-gray-400">加载中...</div>;

  return <Dashboard stats={stats || {}} onNavigate={handleNavigate} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 overflow-auto">
          <Routes>
            <Route path="/" element={<DashboardWrapper />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/broadcast" element={<Broadcast />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
