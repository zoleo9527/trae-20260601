import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { BatchTrace } from './pages/BatchTrace';
import { CaseDetail } from './pages/CaseDetail';
import { CaseList } from './pages/CaseList';
import { RecallManage } from './pages/RecallManage';
import { Reinspection } from './pages/Reinspection';
import { ReturnForm } from './pages/ReturnForm';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<CaseList />} />
          <Route path="/return/new" element={<ReturnForm />} />
          <Route path="/return/:id" element={<CaseDetail />} />
          <Route path="/return/:id/trace" element={<BatchTrace />} />
          <Route path="/return/:id/reinspect" element={<Reinspection />} />
          <Route path="/trace" element={<BatchTrace />} />
          <Route path="/recalls" element={<RecallManage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
