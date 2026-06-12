import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import NewApplication from "@/pages/NewApplication";
import ApplicationDetail from "@/pages/ApplicationDetail";
import InspectionPage from "@/pages/Inspection";
import CostBreakdownPage from "@/pages/CostBreakdown";
import ConfirmationPage from "@/pages/Confirmation";
import Empty from "@/components/Empty";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="application/new" element={<NewApplication />} />
          <Route path="application/:id" element={<ApplicationDetail />} />
          <Route path="application/:id/inspection" element={<InspectionPage />} />
          <Route path="application/:id/cost" element={<CostBreakdownPage />} />
          <Route path="application/:id/confirmation" element={<ConfirmationPage />} />
          <Route path="*" element={<Empty />} />
        </Route>
      </Routes>
    </Router>
  );
}
