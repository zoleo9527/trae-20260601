import ApprovalPage from '@/pages/ApprovalPage'
import CaregiverReminders from '@/pages/CaregiverReminders'
import CaregiverReports from '@/pages/CaregiverReports'
import RoleSelectPage from '@/pages/RoleSelect'
import SocialWorkerPage from '@/pages/SocialWorkerPage'
import SupervisorDashboard from '@/pages/SupervisorDashboard'
import { useAppStore } from '@/store'
import { ROLE_LABELS } from '@/types'
import { ArrowLeftRight } from 'lucide-react'
import { useEffect } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'

function TopBar() {
  const currentRole = useAppStore((s) => s.currentRole)
  const clearRole = useAppStore((s) => s.clearRole)
  const navigate = useNavigate()

  if (!currentRole) return null

  return (
    <div className="h-14 bg-white border-b flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">当前角色</span>
        <span className="font-semibold text-primary-700">
          {ROLE_LABELS[currentRole]}
        </span>
      </div>
      <button
        onClick={() => {
          clearRole()
          navigate('/')
        }}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-700 transition-colors"
      >
        <ArrowLeftRight className="w-4 h-4" />
        切换角色
      </button>
    </div>
  )
}

export default function App() {
  const location = useLocation()
  const startTimeoutChecker = useAppStore((s) => s.startTimeoutChecker)
  const stopTimeoutChecker = useAppStore((s) => s.stopTimeoutChecker)

  useEffect(() => {
    startTimeoutChecker()
    return () => stopTimeoutChecker()
  }, [startTimeoutChecker, stopTimeoutChecker])

  if (location.pathname === '/') {
    return (
      <Routes>
        <Route path="/" element={<RoleSelectPage />} />
      </Routes>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar />
      <main className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<RoleSelectPage />} />
          <Route path="/supervisor" element={<SupervisorDashboard />} />
          <Route path="/supervisor/approval" element={<ApprovalPage />} />
          <Route path="/caregiver" element={<CaregiverReminders />} />
          <Route path="/caregiver/report" element={<CaregiverReports />} />
          <Route path="/social-worker" element={<SocialWorkerPage />} />
        </Routes>
      </main>
    </div>
  )
}
