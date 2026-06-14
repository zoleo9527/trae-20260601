import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Workbench } from './pages/Workbench';
import { ReviewDetail } from './pages/ReviewDetail';
import { ArchiveView } from './pages/ArchiveView';

export default function App() {
  return (
    <Router>
      <div className="h-screen w-screen overflow-hidden">
        <Routes>
          <Route path="/" element={<Workbench />} />
          <Route path="/review/:id" element={<ReviewDetail />} />
          <Route path="/archive" element={<ArchiveView />} />
          <Route path="/archive/:id" element={<ArchiveView />} />
        </Routes>
      </div>
    </Router>
  );
}
