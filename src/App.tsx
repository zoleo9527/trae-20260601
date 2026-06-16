import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import StockRequestPage from './pages/StockRequestPage';
import DeliveryStatusPage from './pages/DeliveryStatusPage';
import ArrivalInspectionPage from './pages/ArrivalInspectionPage';
import DifferenceHandlingPage from './pages/DifferenceHandlingPage';
import StoreFeedbackPage from './pages/StoreFeedbackPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'stock-request':
        return <StockRequestPage />;
      case 'delivery-status':
        return <DeliveryStatusPage />;
      case 'arrival-inspection':
        return <ArrivalInspectionPage />;
      case 'difference-handling':
        return <DifferenceHandlingPage />;
      case 'store-feedback':
        return <StoreFeedbackPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
