import Sidebar from '@/components/Sidebar'
import { useParcelStore } from '@/store/parcelStore'
import { Outlet } from 'react-router-dom'

const ROLE_LABELS: Record<string, string> = {
  customer_service: '客服',
  courier: '派件员',
  station_manager: '驿站负责人',
}

export default function Layout() {
  const { currentRole, currentStaffName } = useParcelStore()

  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-56 min-h-screen flex-1 bg-slate-50">
        <div className="flex items-center gap-4 border-b bg-white px-6 py-3">
          <span className="text-sm text-slate-500">当前角色：</span>
          <span className="font-medium text-slate-800">{ROLE_LABELS[currentRole] ?? currentRole}</span>
          <span className="text-slate-300">|</span>
          <span className="text-sm text-slate-500">当前员工：</span>
          <span className="font-medium text-slate-800">{currentStaffName}</span>
        </div>
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
