import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "@/components/Layout"
import Dashboard from "@/pages/Dashboard"
import Containers from "@/pages/Containers"
import GateRecords from "@/pages/GateRecords"
import YardMap from "@/pages/YardMap"
import Overstay from "@/pages/Overstay"
import FeeReview from "@/pages/FeeReview"
import ContainerDetail from "@/pages/ContainerDetail"
import Inspection from "@/pages/Inspection"
import Misplaced from "@/pages/Misplaced"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/containers" element={<Containers />} />
          <Route path="/gate-records" element={<GateRecords />} />
          <Route path="/yard-map" element={<YardMap />} />
          <Route path="/overstay" element={<Overstay />} />
          <Route path="/fee-review" element={<FeeReview />} />
          <Route path="/containers/:id" element={<ContainerDetail />} />
          <Route path="/inspection" element={<Inspection />} />
          <Route path="/misplaced" element={<Misplaced />} />
        </Route>
      </Routes>
    </Router>
  )
}
