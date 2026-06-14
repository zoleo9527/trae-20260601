import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { RenewalsList } from './pages/RenewalsList';
import { RenewalDetail } from './pages/RenewalDetail';
import { CommunicationsList } from './pages/CommunicationsList';
import { CommunicationDetail } from './pages/CommunicationDetail';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/renewals" element={<RenewalsList />} />
        <Route path="/renewals/:id" element={<RenewalDetail />} />
        <Route path="/communications" element={<CommunicationsList />} />
        <Route path="/communications/:id" element={<CommunicationDetail />} />
      </Routes>
    </Layout>
  );
}

export default App;
