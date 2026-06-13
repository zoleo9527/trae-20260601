import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import JobAudit from './pages/JobAudit'
import JobManagement from './pages/JobManagement'
import InterviewManagement from './pages/InterviewManagement'
import DataReset from './pages/DataReset'
import { useAuthStore } from './store/authStore'
import { useEffect } from 'react'

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { user, token, loadUser } = useAuthStore()
  
  useEffect(() => {
    if (token && !user) {
      loadUser()
    }
  }, [token, user, loadUser])
  
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