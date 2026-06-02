import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "@/pages/Home";
import Receiving from "@/pages/Receiving";
import Appraisal from "@/pages/Appraisal";
import Operations from "@/pages/Operations";
import Finance from "@/pages/Finance";
import ProductDetail from "@/pages/ProductDetail";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/receiving" element={<Receiving />} />
        <Route path="/appraisal" element={<Appraisal />} />
        <Route path="/operations" element={<Operations />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
