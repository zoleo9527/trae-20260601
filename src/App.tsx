import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/Layout';
import DraftList from './pages/DraftList';
import ScheduleList from './pages/ScheduleList';
import MaterialPickupList from './pages/MaterialPickupList';
import InstallationList from './pages/InstallationList';
import ScheduleDetail from './pages/ScheduleDetail';
import AuditLogPage from './pages/AuditLogPage';
import ExceptionPage from './pages/ExceptionPage';
import DemoPage from './pages/DemoPage';
import ModelRelationPage from './pages/ModelRelationPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<ScheduleList />} />
        <Route path="drafts" element={<DraftList />} />
        <Route path="schedules" element={<ScheduleList />} />
        <Route path="schedules/:id" element={<ScheduleDetail />} />
        <Route path="materials" element={<MaterialPickupList />} />
        <Route path="installations" element={<InstallationList />} />
        <Route path="audit-logs" element={<AuditLogPage />} />
        <Route path="exceptions" element={<ExceptionPage />} />
        <Route path="demo" element={<DemoPage />} />
        <Route path="model" element={<ModelRelationPage />} />
      </Route>
    </Routes>
  );
}
