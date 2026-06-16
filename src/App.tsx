import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import StockRequestPage from './pages/StockRequestPage';
import DeliveryStatusPage from './pages/DeliveryStatusPage';
import ArrivalInspectionPage from './pages/ArrivalInspectionPage';
import DifferenceHandlingPage from './pages/DifferenceHandlingPage';
import StoreFeedbackPage from './pages/StoreFeedbackPage';
import { useAppStore } from './store/useStore';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { loadData, isLoading, error } = useAppStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

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
