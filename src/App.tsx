import Layout from '@/components/Layout'
import Bibs from '@/pages/Bibs'
import CheckIn from '@/pages/CheckIn'
import Dashboard from '@/pages/Dashboard'
import Groups from '@/pages/Groups'
import Registrations from '@/pages/Registrations'
import Withdrawals from '@/pages/Withdrawals'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/registrations" element={<Registrations />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/bibs" element={<Bibs />} />
          <Route path="/checkin" element={<CheckIn />} />
          <Route path="/withdrawals" element={<Withdrawals />} />
        </Route>
      </Routes>
    </Router>
  )
}
