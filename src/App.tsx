import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import RoleEntry from '@/pages/RoleEntry'
import Home from '@/pages/Home'
import QualificationList from '@/pages/QualificationList'
import QualificationDetail from '@/pages/QualificationDetail'
import PurchaseList from '@/pages/PurchaseList'
import PurchaseDetail from '@/pages/PurchaseDetail'
import Dashboard from '@/pages/Dashboard'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoleEntry />} />
        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/qualifications" element={<QualificationList />} />
          <Route path="/qualifications/:id" element={<QualificationDetail />} />
          <Route path="/purchases" element={<PurchaseList />} />
          <Route path="/purchases/:id" element={<PurchaseDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </Router>
  )
}
