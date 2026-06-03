import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import BanquetDetail from "@/pages/BanquetDetail";
import VersionCompare from "@/pages/VersionCompare";
import AlertsCenter from "@/pages/AlertsCenter";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/banquet/:id" element={<BanquetDetail />} />
          <Route path="/banquet/:id/compare" element={<VersionCompare />} />
          <Route path="/alerts" element={<AlertsCenter />} />
        </Routes>
      </Layout>
    </Router>
  );
}
