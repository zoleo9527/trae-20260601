import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import RoleSelect from '@/pages/RoleSelect'
import SupervisorDashboard from '@/pages/supervisor/Dashboard'
import SupervisorTasks from '@/pages/supervisor/Tasks'
import MinibarReview from '@/pages/supervisor/MinibarReview'
import Handover from '@/pages/supervisor/Handover'
import AttendantDashboard from '@/pages/attendant/Dashboard'
import Inspection from '@/pages/attendant/Inspection'
import MinibarCheckPage from '@/pages/attendant/MinibarCheck'
import MinibarHistory from '@/pages/attendant/MinibarHistory'
import EngineerDashboard from '@/pages/engineer/Dashboard'
import OrderDetail from '@/pages/engineer/OrderDetail'
import { useAppStore } from '@/store'

function SupervisorLayout() {
  const navigate = useNavigate()
  const { users, currentUserId, setCurrentUser } = useAppStore()
  const userName = users.find((u) => u.id === currentUserId)?.name ?? ''
  const handleLogout = () => {
    setCurrentUser('', '' as any)
    navigate('/')
  }
  return <Layout role="supervisor" userName={userName} onLogout={handleLogout} />
}

function AttendantLayout() {
  const navigate = useNavigate()
  const { users, currentUserId, setCurrentUser } = useAppStore()
  const userName = users.find((u) => u.id === currentUserId)?.name ?? ''
  const handleLogout = () => {
    setCurrentUser('', '' as any)
    navigate('/')
  }
  return <Layout role="attendant" userName={userName} onLogout={handleLogout} />
}

function EngineerLayout() {
  const navigate = useNavigate()
  const { users, currentUserId, setCurrentUser } = useAppStore()
  const userName = users.find((u) => u.id === currentUserId)?.name ?? ''
  const handleLogout = () => {
    setCurrentUser('', '' as any)
    navigate('/')
  }
  return <Layout role="engineer" userName={userName} onLogout={handleLogout} />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleSelect />} />

        <Route path="/supervisor" element={<SupervisorLayout />}>
          <Route index element={<SupervisorDashboard />} />
          <Route path="tasks" element={<SupervisorTasks />} />
          <Route path="minibar-review" element={<MinibarReview />} />
          <Route path="handover" element={<Handover />} />
        </Route>

        <Route path="/attendant" element={<AttendantLayout />}>
          <Route index element={<AttendantDashboard />} />
          <Route path="inspect/:taskId" element={<Inspection />} />
          <Route path="minibar/:taskId" element={<MinibarCheckPage />} />
          <Route path="minibar-history" element={<MinibarHistory />} />
        </Route>

        <Route path="/engineer" element={<EngineerLayout />}>
          <Route index element={<EngineerDashboard />} />
          <Route path="order/:orderId" element={<OrderDetail />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
