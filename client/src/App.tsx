import { useState } from 'react';
import Layout from './components/Layout';
import Programs from './pages/Programs';
import Attendance from './pages/Attendance';
import MakeupTraining from './pages/MakeupTraining';
import Dashboard from './pages/Dashboard';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'programs':
        return <Programs />;
      case 'attendance':
        return <Attendance />;
      case 'makeup':
        return <MakeupTraining />;
      case 'dashboard':
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

export default App;
