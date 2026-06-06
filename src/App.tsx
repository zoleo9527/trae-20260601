import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import StudentList from './pages/StudentList';
import StudentDetail from './pages/StudentDetail';
import TransferApplication from './pages/TransferApplication';
import TransferApproval from './pages/TransferApproval';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/students" replace />} />
        <Route path="/students" element={<StudentList />} />
        <Route path="/students/:id" element={<StudentDetail />} />
        <Route path="/transfer/new/:studentId" element={<TransferApplication />} />
        <Route path="/transfer/:id" element={<TransferApplication />} />
        <Route path="/approvals" element={<TransferApproval />} />
      </Routes>
    </Layout>
  );
}

export default App;
