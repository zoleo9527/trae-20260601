import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import GateDashboard from '@/pages/GateDashboard'
import DispatchDashboard from '@/pages/DispatchDashboard'
import ServiceDashboard from '@/pages/ServiceDashboard'
import ContainerRegister from '@/pages/ContainerRegister'
import ContainerList from '@/pages/ContainerList'
import YardMap from '@/pages/YardMap'
import InspectionPage from '@/pages/InspectionPage'
import MoveTasks from '@/pages/MoveTasks'
import ProblemCenter from '@/pages/ProblemCenter'
import ProblemDetail from '@/pages/ProblemDetail'
import Logs from '@/pages/Logs'

function AuthGuard({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user && !allowedRoles.includes(user.role)) return <Navigate to={`/${user.role}`} replace />
  return <>{children}</>
}

export default function App() {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage)

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/gate" element={<AuthGuard allowedRoles={['gate']}><Layout /></AuthGuard>}>
          <Route index element={<GateDashboard />} />
          <Route path="register" element={<ContainerRegister />} />
          <Route path="containers" element={<ContainerList />} />
          <Route path="logs" element={<Logs />} />
        </Route>
        <Route path="/dispatch" element={<AuthGuard allowedRoles={['dispatch']}><Layout /></AuthGuard>}>
          <Route index element={<DispatchDashboard />} />
          <Route path="yard" element={<YardMap />} />
          <Route path="inspection" element={<InspectionPage />} />
          <Route path="move-tasks" element={<MoveTasks />} />
          <Route path="logs" element={<Logs />} />
        </Route>
        <Route path="/service" element={<AuthGuard allowedRoles={['service']}><Layout /></AuthGuard>}>
          <Route index element={<ServiceDashboard />} />
          <Route path="problems" element={<ProblemCenter />} />
          <Route path="problems/:id" element={<ProblemDetail />} />
          <Route path="logs" element={<Logs />} />
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}
