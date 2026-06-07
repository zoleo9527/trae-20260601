import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import Home from '@/pages/Home';
import BottleReturnPage from '@/pages/BottleReturnPage';
import DepositReconciliationPage from '@/pages/DepositReconciliationPage';
import ListPage from '@/pages/ListPage';
import LogsPage from '@/pages/LogsPage';
import AlertsPage from '@/pages/AlertsPage';
import NearExpiryPage from '@/pages/NearExpiryPage';
import OffShelfReviewPage from '@/pages/OffShelfReviewPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/bottles" element={<BottleReturnPage />} />
        <Route path="/deposits" element={<DepositReconciliationPage />} />
        <Route path="/list" element={<ListPage />} />
        <Route path="/logs" element={<LogsPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/near-expiry" element={<NearExpiryPage />} />
        <Route path="/off-shelf-review" element={<OffShelfReviewPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
