import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import ApprovalList from "@/pages/ApprovalList";
import ApprovalDetail from "@/pages/ApprovalDetail";
import CalculationList from "@/pages/CalculationList";
import CalculationDetail from "@/pages/CalculationDetail";
import DataManagement from "@/pages/DataManagement";
import Settings from "@/pages/Settings";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/approval" element={<ApprovalList />} />
          <Route path="/approval/:id" element={<ApprovalDetail />} />
          <Route path="/calculation" element={<CalculationList />} />
          <Route path="/calculation/:id" element={<CalculationDetail />} />
          <Route path="/data" element={<DataManagement />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}
