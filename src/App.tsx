import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import RoleSelect from '@/pages/RoleSelect'
import FollowUp from '@/pages/FollowUp'
import WarningCenter from '@/pages/WarningCenter'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoleSelect />} />
        <Route path="/followup" element={<FollowUp />} />
        <Route path="/warning" element={<WarningCenter />} />
      </Routes>
    </Router>
  )
}
