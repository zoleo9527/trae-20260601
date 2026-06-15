import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { OrderDetail } from './pages/OrderDetail';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/order/:id" element={<OrderDetail />} />
        </Routes>
      </Layout>
    </Router>
  );
}
