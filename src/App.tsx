import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { RefundList } from './pages/RefundList';
import { RefundDetail } from './pages/RefundDetail';
import { VisitList } from './pages/VisitList';
import { VisitDetail } from './pages/VisitDetail';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/refunds" replace />} />
        <Route path="refunds" element={<RefundList />} />
        <Route path="refunds/:id" element={<RefundDetail />} />
        <Route path="visits" element={<VisitList />} />
        <Route path="visits/:id" element={<VisitDetail />} />
      </Route>
    </Routes>
  );
}

export default App;
