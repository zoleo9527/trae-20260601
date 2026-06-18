import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import CourseDetail from "@/pages/CourseDetail";
import Materials from "@/pages/Materials";
import Backup from "@/pages/Backup";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/course/:id" element={<CourseDetail />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/backup" element={<Backup />} />
        </Routes>
      </Layout>
    </Router>
  );
}
