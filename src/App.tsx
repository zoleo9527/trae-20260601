import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Workbench } from './pages/Workbench';
import { AppealDetail } from './pages/AppealDetail';
import { HistoryPage } from './pages/HistoryPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Workbench />} />
        <Route path="/appeal/:id" element={<AppealDetail />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </BrowserRouter>
  );
}