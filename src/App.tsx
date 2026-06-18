import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import Dashboard from "@/pages/Dashboard";
import VerificationList from "@/pages/VerificationList";
import VerificationDetailPage from "@/pages/VerificationDetailPage";
import ComplaintList from "@/pages/ComplaintList";
import ComplaintDetailPage from "@/pages/ComplaintDetailPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<PageLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/verification" element={<VerificationList />} />
          <Route path="/verification/:id" element={<VerificationDetailPage />} />
          <Route path="/complaints" element={<ComplaintList />} />
          <Route path="/complaints/:id" element={<ComplaintDetailPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
