import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/pages/Dashboard";
import Veterinary from "@/pages/Veterinary";
import Quarantine from "@/pages/Quarantine";
import Traceability from "@/pages/Traceability";
import Milking from "@/pages/Milking";
import Feeding from "@/pages/Feeding";

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/veterinary" element={<Veterinary />} />
          <Route path="/quarantine" element={<Quarantine />} />
          <Route path="/traceability" element={<Traceability />} />
          <Route path="/milking" element={<Milking />} />
          <Route path="/feeding" element={<Feeding />} />
        </Routes>
      </div>
    </Router>
  );
}
