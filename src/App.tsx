import Layout from "@/components/Layout/Layout";
import CaseDetail from "@/pages/CaseDetail/CaseDetail";
import Dashboard from "@/pages/Dashboard/Dashboard";
import DemoFlow from "@/pages/DemoFlow/DemoFlow";
import FosterArrangement from "@/pages/FosterArrangement/FosterArrangement";
import ReviewCenter from "@/pages/ReviewCenter/ReviewCenter";
import SupplyUsage from "@/pages/SupplyUsage/SupplyUsage";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/case/:id" element={<CaseDetail />} />
          <Route path="/case/:id/foster" element={<FosterArrangement />} />
          <Route path="/case/:id/supply" element={<SupplyUsage />} />
          <Route path="/review" element={<ReviewCenter />} />
          <Route path="/demo" element={<DemoFlow />} />
        </Routes>
      </Layout>
    </Router>
  );
}
