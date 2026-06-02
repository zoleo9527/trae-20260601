import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import Versions from "@/pages/Versions";
import Review from "@/pages/Review";
import Delivery from "@/pages/Delivery";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/projects/:id/versions" element={<Versions />} />
          <Route path="/projects/:id/review" element={<Review />} />
          <Route path="/delivery" element={<Delivery />} />
        </Route>
      </Routes>
    </Router>
  );
}
