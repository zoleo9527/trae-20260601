import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "@/components/Layout"
import Dashboard from "@/pages/Dashboard"
import DiversionList from "@/pages/DiversionList"
import DiversionDetail from "@/pages/DiversionDetail"
import MissedList from "@/pages/MissedList"
import MissedDetail from "@/pages/MissedDetail"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/diversion" element={<DiversionList />} />
          <Route path="/diversion/:id" element={<DiversionDetail />} />
          <Route path="/missed" element={<MissedList />} />
          <Route path="/missed/:id" element={<MissedDetail />} />
        </Route>
      </Routes>
    </Router>
  )
}
