import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import StorageList from './pages/StorageList';
import StorageDetail from './pages/StorageDetail';
import TemperatureReview from './pages/TemperatureReview';
import BackupRestore from './pages/BackupRestore';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/storage" replace />} />
        <Route path="storage" element={<StorageList />} />
        <Route path="storage/:id" element={<StorageDetail />} />
        <Route path="temperature" element={<TemperatureReview />} />
        <Route path="backup" element={<BackupRestore />} />
      </Route>
    </Routes>
  );
}

export default App;
