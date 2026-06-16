import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Dashboard } from '@/pages/Dashboard';
import { OrderDetail } from '@/pages/OrderDetail';

type PageType = 'dashboard' | 'order-detail';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setCurrentPage('order-detail');
  };

  const handleNavigate = (page: 'dashboard') => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        currentPage={currentPage} 
        onNavigate={handleNavigate} 
      />
      <main>
        {currentPage === 'dashboard' && (
          <Dashboard onSelectOrder={handleSelectOrder} />
        )}
        {currentPage === 'order-detail' && (
          <OrderDetail 
            orderId={selectedOrderId} 
            onBack={() => setCurrentPage('dashboard')} 
          />
        )}
      </main>
    </div>
  );
}

export default App;
