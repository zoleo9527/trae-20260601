import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Overview from '@/pages/Overview';
import ReassessmentDetail from '@/pages/ReassessmentDetail';
import Approval from '@/pages/Approval';
import FollowupDetail from '@/pages/FollowupDetail';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/reassessment/:id" element={<ReassessmentDetail />} />
          <Route path="/approval" element={<Approval />} />
          <Route path="/followup/:id" element={<FollowupDetail />} />
        </Routes>
      </Layout>
    </Router>
  );
}
