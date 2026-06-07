import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Dashboard } from '@/pages/Dashboard';
import { DifferenceList } from '@/pages/DifferenceList';
import { DifferenceDetail } from '@/pages/DifferenceDetail';
import { LossList } from '@/pages/LossList';
import { LossDetail } from '@/pages/LossDetail';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="differences" element={<DifferenceList />} />
        <Route path="differences/:id" element={<DifferenceDetail />} />
        <Route path="loss" element={<LossList />} />
        <Route path="loss/:id" element={<LossDetail />} />
      </Route>
    </Routes>
  );
}

export default App;
