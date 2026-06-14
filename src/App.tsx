import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/common/Layout';
import { DashboardPage } from '@/pages/DashboardPage';
import { EnrollmentPage } from '@/pages/EnrollmentPage';
import { ArchivePage } from '@/pages/ArchivePage';
import { CoachPage } from '@/pages/CoachPage';
import { ExamPage } from '@/pages/ExamPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { useStore } from '@/stores/appStore';

function App() {
  const { loadUsers, loadStudents, setCurrentUser, loadNotifications } = useStore();

  useEffect(() => {
    loadUsers();
    loadStudents();
    setCurrentUser('u1');
    loadNotifications();
  }, []);

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/enrollment" element={<EnrollmentPage />} />
          <Route path="/archive" element={<ArchivePage />} />
          <Route path="/coach" element={<CoachPage />} />
          <Route path="/exam" element={<ExamPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
