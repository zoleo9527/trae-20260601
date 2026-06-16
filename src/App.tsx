import { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import FabricReservation from './pages/FabricReservation';
import PatternScheduling from './pages/PatternScheduling';
import OrderDetail from './pages/OrderDetail';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    setSelectedOrderId(null);
  };

  const handleViewOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
  };

  const handleBack = () => {
    setSelectedOrderId(null);
  };

  const renderContent = () => {
    if (selectedOrderId) {
      return <OrderDetail orderId={selectedOrderId} onBack={handleBack} />;
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} onViewOrder={handleViewOrder} />;
      case 'fabric-reservation':
        return <FabricReservation onViewOrder={handleViewOrder} />;
      case 'pattern-scheduling':
        return <PatternScheduling onViewOrder={handleViewOrder} />;
      default:
        return <Dashboard onNavigate={handleNavigate} onViewOrder={handleViewOrder} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={handleNavigate}>
      {renderContent()}
    </Layout>
  );
}