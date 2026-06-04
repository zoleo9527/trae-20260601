import { useAppStore } from '@/store'
import type { Role } from '@/types'
import { AlertTriangle, Bell, ClipboardCheck, FileText, LayoutDashboard, MessageSquare } from 'lucide-react'
import { NavLink } from 'react-router-dom'

interface SidebarProps {
  role: Role
}

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
}

const NAV_ITEMS: Record<Role, NavItem[]> = {
  supervisor: [
    { label: '概览台', path: '/supervisor', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: '审批台', path: '/supervisor/approval', icon: <ClipboardCheck className="w-5 h-5" /> },
  ],
  caregiver: [
    { label: '提醒台', path: '/caregiver', icon: <Bell className="w-5 h-5" /> },
    { label: '上报台', path: '/caregiver/report', icon: <FileText className="w-5 h-5" /> },
  ],
  social_worker: [
    { label: '沟通台', path: '/social-worker', icon: <MessageSquare className="w-5 h-5" /> },
  ],
}

export function Sidebar({ role }: SidebarProps) {
  const items = NAV_ITEMS[role]
  const reports = useAppStore((s) => s.reports)
  const draftCount = reports.filter((r) => r.status === 'draft').length

  return (
    <aside className="w-60 bg-white border-r shrink-0 flex flex-col">
      <nav className="flex-1 py-4 px-3 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <div className="flex items-center gap-3">
              {item.icon}
              {item.label}
            </div>
            {role === 'caregiver' && item.path === '/caregiver/report' && draftCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-white bg-red-500 rounded-full animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                {draftCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {role === 'caregiver' && draftCount > 0 && (
        <div className="p-3 mx-3 mb-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <p className="text-xs font-medium">
              有 {draftCount} 条异常上报待完成
            </p>
          </div>
        </div>
      )}
    </aside>
  )
}
