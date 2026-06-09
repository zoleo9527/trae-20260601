import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import DispatchPage from '@/pages/DispatchPage'
import PackageDetail from '@/pages/PackageDetail'
import PickupPage from '@/pages/PickupPage'
import ProblemPage from '@/pages/ProblemPage'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="dispatch" element={<DispatchPage />} />
          <Route path="problems" element={<ProblemPage />} />
          <Route path="pickup" element={<PickupPage />} />
          <Route path="package/:id" element={<PackageDetail />} />
        </Route>
      </Routes>
    </Router>
  )
}
