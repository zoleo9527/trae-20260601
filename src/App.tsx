import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "@/components/Layout"
import Dashboard from "@/pages/Dashboard"
import Arrangement from "@/pages/Arrangement"
import SeatAllocation from "@/pages/SeatAllocation"
import AuditTrail from "@/pages/AuditTrail"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/arrangement" element={<Arrangement />} />
          <Route path="/seat-allocation" element={<SeatAllocation />} />
          <Route path="/audit-trail" element={<AuditTrail />} />
        </Route>
      </Routes>
    </Router>
  )
}
