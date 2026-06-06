import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { Detention } from "@/pages/Detention";
import { Appeal } from "@/pages/Appeal";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="detention" element={<Detention />} />
          <Route path="appeal" element={<Appeal />} />
        </Route>
      </Routes>
    </Router>
  );
}
