import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import InspectionList from "@/pages/InspectionList";
import InspectionDetail from "@/pages/InspectionDetail";
import DriverSign from "@/pages/DriverSign";
import SignReview from "@/pages/SignReview";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inspections" element={<InspectionList />} />
          <Route path="/inspections/:id" element={<InspectionDetail />} />
          <Route path="/inspections/:id/sign" element={<DriverSign />} />
          <Route path="/inspections/:id/review" element={<SignReview />} />
        </Routes>
      </Layout>
    </Router>
  );
}
