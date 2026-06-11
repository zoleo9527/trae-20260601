import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { PromotionDetail } from './pages/PromotionDetail';
import { SalesReview } from './pages/SalesReview';
import { ImportExport } from './pages/ImportExport';
import { useAppStore } from './store/useAppStore';
import { initializeMockData } from './data/mockData';

function App() {
  const initialize = useAppStore(state => state.initialize);

  useEffect(() => {
    initializeMockData();
    initialize();
  }, [initialize]);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/promotion/new" element={<PromotionDetail />} />
        <Route path="/promotion/:id" element={<PromotionDetail />} />
        <Route path="/sales" element={<SalesReview />} />
        <Route path="/sales/:id" element={<SalesReview />} />
        <Route path="/io" element={<ImportExport />} />
      </Routes>
    </Layout>
  );
}

export default App;
