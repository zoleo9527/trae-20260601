import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { WorkOrdersPage } from './pages/WorkOrders';
import { WorkOrderDetailPage } from './pages/WorkOrderDetailPage';
import { PolicyJudge } from './pages/PolicyJudge';
import { ApprovalPage } from './pages/Approval';
import { SignReceiptPage } from './pages/SignReceipt';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="work-orders" element={<WorkOrdersPage />} />
          <Route path="work-orders/:id" element={<WorkOrderDetailPage />} />
          <Route path="policy-judge" element={<PolicyJudge />} />
          <Route path="policy-judge/:id" element={<PolicyJudge />} />
          <Route path="approval" element={<ApprovalPage />} />
          <Route path="approval/:id" element={<ApprovalPage />} />
          <Route path="sign-receipt" element={<SignReceiptPage />} />
          <Route path="sign-receipt/:id" element={<SignReceiptPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
