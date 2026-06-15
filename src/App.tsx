import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import Dashboard from '@/pages/Dashboard';
import ReservationDetail from '@/pages/ReservationDetail';
import ContractDetail from '@/pages/ContractDetail';
import RepairDetail from '@/pages/RepairDetail';
import Settings from '@/pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="pb-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/reservation/:id" element={<ReservationDetail />} />
            <Route path="/contract/:id" element={<ContractDetail />} />
            <Route path="/repair/:id" element={<RepairDetail />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
