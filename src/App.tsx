import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Appointments } from './pages/Appointments';
import { Triage } from './pages/Triage';
import { Schedule } from './pages/Schedule';
import { Scales } from './pages/Scales';
import { RiskAlert } from './pages/RiskAlert';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="triage" element={<Triage />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="scales" element={<Scales />} />
          <Route path="risk" element={<RiskAlert />} />
        </Route>
      </Routes>
    </Router>
  );
}
