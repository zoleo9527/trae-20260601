import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TrainingList from './pages/TrainingList';
import TrainingDetail from './pages/TrainingDetail';
import CertificateList from './pages/CertificateList';
import CertificateDetail from './pages/CertificateDetail';
import EvaluationList from './pages/EvaluationList';
import EvaluationDetail from './pages/EvaluationDetail';
import ExceptionList from './pages/ExceptionList';
import ExceptionDetail from './pages/ExceptionDetail';

function App() {
  const { user } = useAuth();

  if (!user) {
    return <div>加载中...</div>;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/training" element={<TrainingList />} />
        <Route path="/training/:id" element={<TrainingDetail />} />
        <Route path="/certificates" element={<CertificateList />} />
        <Route path="/certificates/:id" element={<CertificateDetail />} />
        <Route path="/evaluations" element={<EvaluationList />} />
        <Route path="/evaluations/:id" element={<EvaluationDetail />} />
        <Route path="/exceptions" element={<ExceptionList />} />
        <Route path="/exceptions/:id" element={<ExceptionDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
