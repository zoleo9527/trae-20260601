
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import PromotionList from '@/pages/PromotionList';
import PromotionDetail from '@/pages/PromotionDetail';
import PromotionCreate from '@/pages/PromotionCreate';
import InspectionList from '@/pages/InspectionList';
import InspectionDetail from '@/pages/InspectionDetail';
import InspectionCreate from '@/pages/InspectionCreate';
import Settings from '@/pages/Settings';
import MainLayout from '@/components/MainLayout';
import { useUserStore } from '@/store/userStore';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useUserStore((s) => s.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="promotion" element={<PromotionList />} />
        <Route path="promotion/:id" element={<PromotionDetail />} />
        <Route path="promotion/create" element={<PromotionCreate />} />
        <Route path="inspection" element={<InspectionList />} />
        <Route path="inspection/:id" element={<InspectionDetail />} />
        <Route path="inspection/create" element={<InspectionCreate />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1e40af',
          borderRadius: 8,
        },
      }}
    >
      <Router>
        <AppRoutes />
      </Router>
    </ConfigProvider>
  );
}
