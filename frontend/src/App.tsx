import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import Registrations from './pages/Registrations';
import Physicals from './pages/Physicals';
import Exceptions from './pages/Exceptions';
import Handover from './pages/Handover';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

      <Route
        path="/registrar"
        element={<AppLayout role="registrar" />}
      >
        <Route index element={<Dashboard role="registrar" />} />
        <Route path="registrations" element={<Registrations />} />
        <Route path="handover" element={<Handover role="registrar" />} />
      </Route>

      <Route
        path="/fieldCoach"
        element={<AppLayout role="fieldCoach" />}
      >
        <Route index element={<Dashboard role="fieldCoach" />} />
        <Route path="physicals" element={<Physicals role="fieldCoach" />} />
        <Route path="exceptions" element={<Exceptions role="fieldCoach" />} />
        <Route path="handover" element={<Handover role="fieldCoach" />} />
      </Route>

      <Route
        path="/safetyOfficer"
        element={<AppLayout role="safetyOfficer" />}
      >
        <Route index element={<Dashboard role="safetyOfficer" />} />
        <Route path="physicals" element={<Physicals role="safetyOfficer" />} />
        <Route path="exceptions" element={<Exceptions role="safetyOfficer" />} />
        <Route path="handover" element={<Handover role="safetyOfficer" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
