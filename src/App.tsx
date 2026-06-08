import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "@/components/Layout"
import Dashboard from "@/pages/Dashboard"
import Arrival from "@/pages/Arrival"
import Pickup from "@/pages/Pickup"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/arrival" element={<Arrival />} />
          <Route path="/pickup" element={<Pickup />} />
        </Route>
      </Routes>
    </Router>
  )
}
