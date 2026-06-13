import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import JobAudit from './pages/JobAudit'
import JobManagement from './pages/JobManagement'
import InterviewManagement from './pages/InterviewManagement'
import DataReset from './pages/DataReset'
import { useAuthStore } from './store/authStore'
import { useEffect, useState } from 'react'

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { user, token, loadUser } = useAuthStore()
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const init = async () => {
      if (token && !user) {
        await loadUser()
      }
      setLoading(false)
    }
    init()
  }, [token, user, loadUser])
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  if (!token || !user) {
    return <Navigate to="/login" replace />
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
        <Route path="/jobs/pending" element={<ProtectedRoute allowedRoles={['operator']}><Layout><JobAudit /></Layout></ProtectedRoute>} />
        <Route path="/jobs/manage" element={<ProtectedRoute allowedRoles={['consultant', 'hr']}><Layout><JobManagement /></Layout></ProtectedRoute>} />
        <Route path="/interviews" element={<ProtectedRoute allowedRoles={['consultant', 'hr']}><Layout><InterviewManagement /></Layout></ProtectedRoute>} />
        <Route path="/reset" element={<ProtectedRoute allowedRoles={['operator']}><Layout><DataReset /></Layout></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App