import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Bookings from "@/pages/Bookings";
import Equipment from "@/pages/Equipment";
import Anomalies from "@/pages/Anomalies";
import Handover from "@/pages/Handover";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route path="/anomalies" element={<Anomalies />} />
          <Route path="/handover" element={<Handover />} />
        </Route>
      </Routes>
    </Router>
  );
}
