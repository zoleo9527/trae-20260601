import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ConsultationDetail from './pages/ConsultationDetail';

function ConsultationList() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">咨询受理列表</h1>
      <p className="text-gray-500">管理所有咨询受理记录</p>
    </div>
  );
}

        <Route path="consultations/:id" element={<ConsultationDetail />} /> DocumentChecklist() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">资料清单</h1>
      <p className="text-gray-500">管理咨询受理相关资料</p>
    </div>
  );
}

function BatchEntry() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">批量录入</h1>
      <p className="text-gray-500">批量录入咨询受理记录</p>
    </div>
  );
}

function StaffManagement() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">人员管理</h1>
      <p className="text-gray-500">管理系统人员信息</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="consultations" element={<ConsultationList />} />
        <Route path="consultations/:id" element={<ConsultationDetail />} />
        <Route path="documents" element={<DocumentChecklist />} />
        <Route path="batch" element={<BatchEntry />} />
        <Route path="staff" element={<StaffManagement />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
