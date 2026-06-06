import { Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import RescueList from '@/pages/RescueList';
import RescueDetail from '@/pages/RescueDetail';
import RescueCreate from '@/pages/RescueCreate';
import MedicalList from '@/pages/MedicalList';
import MedicalDetail from '@/pages/MedicalDetail';
import Settings from '@/pages/Settings';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/rescue" element={<RescueList />} />
        <Route path="/rescue/create" element={<RescueCreate />} />
        <Route path="/rescue/:id" element={<RescueDetail />} />
        <Route path="/medical" element={<MedicalList />} />
        <Route path="/medical/:animalId" element={<MedicalDetail />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}

export default App;
