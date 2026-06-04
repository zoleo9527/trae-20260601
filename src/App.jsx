import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import PharmacistDashboard from './pages/PharmacistDashboard.jsx'
import WorkerDashboard from './pages/WorkerDashboard.jsx'
import DeliveryDashboard from './pages/DeliveryDashboard.jsx'
import PrescriptionDetail from './pages/PrescriptionDetail.jsx'
import BatchDetail from './pages/BatchDetail.jsx'
import LabelDetail from './pages/LabelDetail.jsx'

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />
  return children
}

function RoleRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'pharmacist') return <Navigate to="/pharmacist" replace />
  if (user.role === 'worker') return <Navigate to="/worker" replace />
  if (user.role === 'delivery') return <Navigate to="/delivery" replace />
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />
      <Route path="/pharmacist" element={<ProtectedRoute roles={['pharmacist']}><Layout><PharmacistDashboard /></Layout></ProtectedRoute>} />
      <Route path="/pharmacist/prescriptions/:id" element={<ProtectedRoute roles={['pharmacist']}><Layout><PrescriptionDetail /></Layout></ProtectedRoute>} />
      <Route path="/worker" element={<ProtectedRoute roles={['worker']}><Layout><WorkerDashboard /></Layout></ProtectedRoute>} />
      <Route path="/worker/batches/:id" element={<ProtectedRoute roles={['worker']}><Layout><BatchDetail /></Layout></ProtectedRoute>} />
      <Route path="/delivery" element={<ProtectedRoute roles={['delivery']}><Layout><DeliveryDashboard /></Layout></ProtectedRoute>} />
      <Route path="/delivery/labels/:id" element={<ProtectedRoute roles={['delivery']}><Layout><LabelDetail /></Layout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
