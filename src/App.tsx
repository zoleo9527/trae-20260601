import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RoleEntry from '@/pages/RoleEntry';
import CustomerService from '@/pages/CustomerService';
import CustomerServiceOrderDetail from '@/pages/CustomerServiceOrderDetail';
import Designer from '@/pages/Designer';
import DesignerScanProcess from '@/pages/DesignerScanProcess';
import AssignmentReview from '@/pages/AssignmentReview';
import Quality from '@/pages/Quality';
import QualityCheck from '@/pages/QualityCheck';
import AuditLog from '@/pages/AuditLog';
import Integration from '@/pages/Integration';
import { useAppStore } from '@/store/useAppStore';

export default function App() {
  const { initMockData, initialized } = useAppStore();

  useEffect(() => {
    if (!initialized) {
      initMockData();
    }
  }, [initMockData, initialized]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoleEntry />} />
        <Route path="/customer-service" element={<CustomerService />} />
        <Route path="/customer-service/order/:id" element={<CustomerServiceOrderDetail />} />
        <Route path="/designer" element={<Designer />} />
        <Route path="/designer/scan/:id" element={<DesignerScanProcess />} />
        <Route path="/designer/assignments" element={<AssignmentReview />} />
        <Route path="/quality" element={<Quality />} />
        <Route path="/quality/order/:id" element={<QualityCheck />} />
        <Route path="/audit" element={<AuditLog />} />
        <Route path="/integration" element={<Integration />} />
      </Routes>
    </Router>
  );
}
