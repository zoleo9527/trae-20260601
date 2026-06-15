import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { ClaimsPage } from './pages/ClaimsPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { ExceptionsPage } from './pages/ExceptionsPage';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'claims':
        return <ClaimsPage />;
      case 'payments':
        return <PaymentsPage />;
      case 'exceptions':
        return <ExceptionsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="max-w-7xl mx-auto px-6 py-6">
        {renderPage()}
      </main>
      <Sidebar />
    </div>
  );
}

export default App;
