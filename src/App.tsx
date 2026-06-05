import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import IncidentList from '@/pages/IncidentList'
import IncidentDetail from '@/pages/IncidentDetail'
import IncidentProcess from '@/pages/IncidentProcess'
import InsuranceMaterials from '@/pages/InsuranceMaterials'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<IncidentList />} />
          <Route path="/incident/:id" element={<IncidentDetail />} />
          <Route path="/incident/:id/process" element={<IncidentProcess />} />
          <Route path="/incident/:id/insurance" element={<InsuranceMaterials />} />
        </Route>
      </Routes>
    </Router>
  )
}
