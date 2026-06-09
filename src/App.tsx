import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import WorkbenchLayout from "@/components/WorkbenchLayout"
import Dashboard from "@/pages/Dashboard"
import DeliveryList from "@/pages/DeliveryList"
import ProblemList from "@/pages/ProblemList"
import ProblemCreate from "@/pages/ProblemCreate"
import ProblemDetail from "@/pages/ProblemDetail"
import ContactList from "@/pages/ContactList"
import NotificationCenter from "@/pages/NotificationCenter"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<WorkbenchLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/deliveries" element={<DeliveryList />} />
          <Route path="/problems" element={<ProblemList />} />
          <Route path="/problems/new" element={<ProblemCreate />} />
          <Route path="/problems/:id" element={<ProblemDetail />} />
          <Route path="/contacts" element={<ContactList />} />
          <Route path="/notifications" element={<NotificationCenter />} />
        </Route>
      </Routes>
    </Router>
  )
}
