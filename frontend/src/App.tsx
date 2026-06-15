import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './views/Login'
import DispatcherDashboard from './views/DispatcherDashboard'
import LeaderDashboard from './views/LeaderDashboard'
import CustomerDashboard from './views/CustomerDashboard'
import RoleBasedEntry from './components/RoleBasedEntry'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/entry" element={<RoleBasedEntry />} />
      <Route path="/dispatcher" element={<DispatcherDashboard />} />
      <Route path="/leader" element={<LeaderDashboard />} />
      <Route path="/customer" element={<CustomerDashboard />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
