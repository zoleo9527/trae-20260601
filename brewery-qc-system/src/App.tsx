import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { RoleSelect, BrewerDashboard, PackagingDashboard, SalesDashboard, ShiftRecords } from '@/pages';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoleSelect />} />
        <Route path="/brewer" element={<BrewerDashboard />} />
        <Route path="/brewer/batches" element={<BrewerDashboard />} />
        <Route path="/packaging" element={<PackagingDashboard />} />
        <Route path="/packaging/testing" element={<PackagingDashboard />} />
        <Route path="/sales" element={<SalesDashboard />} />
        <Route path="/sales/pending" element={<SalesDashboard />} />
        <Route path="/records" element={<ShiftRecords />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
