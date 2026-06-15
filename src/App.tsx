import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from '@/components/Layout/Sidebar';
import { Header } from '@/components/Layout/Header';
import { Dashboard } from '@/pages/Dashboard';
import { WorkOrderDetail } from '@/pages/WorkOrderDetail';
import { WorkOrderCreate } from '@/pages/WorkOrderCreate';
import { PartsManagement } from '@/pages/PartsManagement';
import { SignoffCenter } from '@/pages/SignoffCenter';
import { EquipmentArchive } from '@/pages/EquipmentArchive';

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/workorder/create" element={<WorkOrderCreate />} />
              <Route path="/workorder/:id" element={<WorkOrderDetail />} />
              <Route path="/parts" element={<PartsManagement />} />
              <Route path="/signoff" element={<SignoffCenter />} />
              <Route path="/equipment" element={<EquipmentArchive />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
