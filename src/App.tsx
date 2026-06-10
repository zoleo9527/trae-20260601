import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import AuditList, { AuditDetail } from "./pages/Audit";
import DispatchList, { DispatchDetail } from "./pages/Dispatch";
import ExceptionList, { ExceptionDetail } from "./pages/Exception";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="audit" element={<AuditList />} />
          <Route path="audit/:id" element={<AuditDetail />} />
          <Route path="dispatch" element={<DispatchList />} />
          <Route path="dispatch/:id" element={<DispatchDetail />} />
          <Route path="exception" element={<ExceptionList />} />
          <Route path="exception/:id" element={<ExceptionDetail />} />
        </Route>
      </Routes>
    </Router>
  );
}
