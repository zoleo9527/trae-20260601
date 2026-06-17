import { useState } from 'react';
import { Header } from './components/Header';
import { Workbench } from './pages/Workbench';
import { Records } from './pages/Records';
import { Approval } from './pages/Approval';
import { CustomerService } from './pages/CustomerService';

function App() {
  const [currentPage, setCurrentPage] = useState('workbench');

  const renderPage = () => {
    switch (currentPage) {
      case 'workbench':
        return <Workbench />;
      case 'records':
        return <Records />;
      case 'approval':
        return <Approval />;
      case 'customer_service':
        return <CustomerService />;
      default:
        return <Workbench />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="pb-8">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;