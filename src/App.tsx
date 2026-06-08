import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Rooms from '@/pages/Rooms'
import RoomDetail from '@/pages/RoomDetail'
import Repairs from '@/pages/Repairs'
import RepairDetail from '@/pages/RepairDetail'
import RepairCreate from '@/pages/RepairCreate'
import Recovery from '@/pages/Recovery'
import RecoveryDetail from '@/pages/RecoveryDetail'
import Audit from '@/pages/Audit'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

export default function App() {
  const { init } = useAuthStore()

  useEffect(() => {
    init()
  }, [init])

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/rooms" element={<ProtectedRoute><Rooms /></ProtectedRoute>} />
        <Route path="/rooms/:id" element={<ProtectedRoute><RoomDetail /></ProtectedRoute>} />
        <Route path="/repairs" element={<ProtectedRoute><Repairs /></ProtectedRoute>} />
        <Route path="/repairs/new" element={<ProtectedRoute><RepairCreate /></ProtectedRoute>} />
        <Route path="/repairs/:id" element={<ProtectedRoute><RepairDetail /></ProtectedRoute>} />
        <Route path="/recovery" element={<ProtectedRoute><Recovery /></ProtectedRoute>} />
        <Route path="/recovery/:id" element={<ProtectedRoute><RecoveryDetail /></ProtectedRoute>} />
        <Route path="/audit" element={<ProtectedRoute><Audit /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}
