import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ReturnList from './pages/ReturnList';
import ReturnDetail from './pages/ReturnDetail';
import ReissueList from './pages/ReissueList';
import ReissueDetail from './pages/ReissueDetail';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/returns" replace />} />
        <Route path="returns" element={<ReturnList />} />
        <Route path="returns/:id" element={<ReturnDetail />} />
        <Route path="reissues" element={<ReissueList />} />
        <Route path="reissues/:id" element={<ReissueDetail />} />
      </Route>
    </Routes>
  );
}

export default App;
