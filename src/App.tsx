import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import ContractList from "@/pages/ContractList";
import ContractDetail from "@/pages/ContractDetail";
import ContractNew from "@/pages/ContractNew";
import ArchiveList from "@/pages/ArchiveList";
import ArchiveDetail from "@/pages/ArchiveDetail";
import BatchEntry from "@/pages/BatchEntry";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/contracts" element={<ContractList />} />
          <Route path="/contracts/new" element={<ContractNew />} />
          <Route path="/contracts/:id" element={<ContractDetail />} />
          <Route path="/archives" element={<ArchiveList />} />
          <Route path="/archives/:id" element={<ArchiveDetail />} />
          <Route path="/batch" element={<BatchEntry />} />
        </Routes>
      </Layout>
    </Router>
  );
}
