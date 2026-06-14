import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import ComplaintList from '@/pages/ComplaintList';
import ComplaintDetail from '@/pages/ComplaintDetail';
import VisitList from '@/pages/VisitList';
import VisitDetail from '@/pages/VisitDetail';

const App: React.FC = () => {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/complaints" element={<ComplaintList />} />
        <Route path="/complaints/:id" element={<ComplaintDetail />} />
        <Route path="/visits" element={<VisitList />} />
        <Route path="/visits/:id" element={<VisitDetail />} />
      </Routes>
    </AppLayout>
  );
};

export default App;
