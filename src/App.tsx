import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import Registrations from "@/pages/Registrations";
import RegistrationDetail from "@/pages/RegistrationDetail";
import Clarifications from "@/pages/Clarifications";
import ClarificationDetail from "@/pages/ClarificationDetail";
import Logs from "@/pages/Logs";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/registrations" element={<Registrations />} />
        <Route path="/registrations/:id" element={<RegistrationDetail />} />
        <Route path="/clarifications" element={<Clarifications />} />
        <Route path="/clarifications/:id" element={<ClarificationDetail />} />
        <Route path="/logs" element={<Logs />} />
      </Routes>
    </Router>
  );
}