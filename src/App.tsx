import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import { Layout } from './pages/Layout';
import { Dashboard } from './pages/Dashboard';
import { VisitList } from './pages/VisitList';
import { VisitNew } from './pages/VisitNew';
import { VisitDetail } from './pages/VisitDetail';
import { CommunicationList } from './pages/CommunicationList';
import { CommunicationNew } from './pages/CommunicationNew';
import { CommunicationDetail } from './pages/CommunicationDetail';
import { ElderList } from './pages/ElderList';
import { ElderDetail } from './pages/ElderDetail';

function App() {
  const { currentUser, switchRole } = useStore();

  useEffect(() => {
    if (!currentUser) {
      switchRole('nurse_manager');
    }
  }, [currentUser, switchRole]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="visits" element={<VisitList />} />
          <Route path="visits/new" element={<VisitNew />} />
          <Route path="visits/:id" element={<VisitDetail />} />
          <Route path="communications" element={<CommunicationList />} />
          <Route path="communications/new" element={<CommunicationNew />} />
          <Route path="communications/:id" element={<CommunicationDetail />} />
          <Route path="elders" element={<ElderList />} />
          <Route path="elders/:id" element={<ElderDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
