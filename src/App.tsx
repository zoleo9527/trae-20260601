import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import Dashboard from '@/pages/Dashboard';
import ShootingSchedules from '@/pages/ShootingSchedules';
import MaterialDeliveries from '@/pages/MaterialDeliveries';
import ProjectDetail from '@/pages/ProjectDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/schedules" element={<ShootingSchedules />} />
          <Route path="/deliveries" element={<MaterialDeliveries />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
