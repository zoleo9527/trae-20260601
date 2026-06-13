import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import TrainingPage from "@/pages/TrainingPage";
import TrainingDetail from "@/pages/TrainingDetail";
import DocumentsPage from "@/pages/DocumentsPage";
import DocumentsDetail from "@/pages/DocumentsDetail";
import ResetPage from "@/pages/ResetPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/training" element={<TrainingPage />} />
          <Route path="/training/:id" element={<TrainingDetail />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/documents/:id" element={<DocumentsDetail />} />
          <Route path="/settings/reset" element={<ResetPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
