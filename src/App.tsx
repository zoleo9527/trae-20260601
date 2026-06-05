import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import RoastCurves from '@/pages/RoastCurves';
import RoastCurveDetail from '@/pages/RoastCurveDetail';
import CuppingScores from '@/pages/CuppingScores';
import CuppingScoreDetail from '@/pages/CuppingScoreDetail';
import ComplaintsInventory from '@/pages/ComplaintsInventory';
import OperationLogs from '@/pages/OperationLogs';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/roast-curves" element={<RoastCurves />} />
          <Route path="/roast-curves/:id" element={<RoastCurveDetail />} />
          <Route path="/cupping-scores" element={<CuppingScores />} />
          <Route path="/cupping-scores/:id" element={<CuppingScoreDetail />} />
          <Route path="/complaints-inventory" element={<ComplaintsInventory />} />
          <Route path="/operation-logs" element={<OperationLogs />} />
        </Route>
      </Routes>
    </Router>
  );
}
