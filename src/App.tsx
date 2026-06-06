import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import DockBoard from "@/pages/DockBoard";
import CheckIn from "@/pages/CheckIn";
import Discrepancy from "@/pages/Discrepancy";
import Records from "@/pages/Records";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dock-board" element={<DockBoard />} />
          <Route path="/check-in" element={<CheckIn />} />
          <Route path="/discrepancy" element={<Discrepancy />} />
          <Route path="/records" element={<Records />} />
        </Route>
      </Routes>
    </Router>
  );
}
