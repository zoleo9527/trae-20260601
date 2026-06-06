import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout';
import ScheduleList from './pages/ScheduleList';
import ScheduleDetail from './pages/ScheduleDetail';
import ScheduleCreate from './pages/ScheduleCreate';
import ProductPool from './pages/ProductPool';
import ProductDetail from './pages/ProductDetail';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/schedules" replace />} />
        <Route path="schedules" element={<ScheduleList />} />
        <Route path="schedules/new" element={<ScheduleCreate />} />
        <Route path="schedules/:id" element={<ScheduleDetail />} />
        <Route path="schedules/:id/edit" element={<ScheduleCreate />} />
        <Route path="products" element={<ProductPool />} />
        <Route path="products/:id" element={<ProductDetail />} />
      </Route>
    </Routes>
  );
}

export default App;
