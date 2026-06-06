import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import Home from "@/pages/Home";
import { Detention } from "@/pages/Detention";
import { Appeal } from "@/pages/Appeal";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="detention" element={<Detention />} />
          <Route path="appeal" element={<Appeal />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
