import Dashboard from "@/pages/Dashboard";
import PrescriptionDetail from "@/pages/PrescriptionDetail";
import RoleSelect from "@/pages/RoleSelect";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoleSelect />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/prescription/:id" element={<PrescriptionDetail />} />
      </Routes>
    </Router>
  );
}
