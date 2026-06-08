import { NavLink, Outlet } from 'react-router-dom'
import { Hotel, LayoutDashboard, ClipboardList, Wine, ArrowRightLeft, ClipboardCheck, History, Wrench, LogOut } from 'lucide-react'
import type { UserRole } from '@/types'

interface LayoutProps {
  role: UserRole
  userName: string
  onLogout: () => void
}

interface NavItem {
  label: string
  icon: React.ReactNode
  to: string
  end?: boolean
}

const supervisorNav: NavItem[] = [
  { label: '房态看板', icon: <LayoutDashboard size={18} />, to: '/supervisor', end: true },
  { label: '任务分配', icon: <ClipboardList size={18} />, to: '/supervisor/tasks' },
  { label: '迷你吧审核', icon: <Wine size={18} />, to: '/supervisor/minibar-review' },
  { label: '交接总览', icon: <ArrowRightLeft size={18} />, to: '/supervisor/handover' },
]

const attendantNav: NavItem[] = [
  { label: '工作台', icon: <ClipboardCheck size={18} />, to: '/attendant', end: true },
  { label: '核对历史', icon: <History size={18} />, to: '/attendant/minibar-history' },
]

const engineerNav: NavItem[] = [
  { label: '维修工单', icon: <Wrench size={18} />, to: '/engineer', end: true },
]

const navMap: Record<UserRole, NavItem[]> = {
  supervisor: supervisorNav,
  attendant: attendantNav,
  engineer: engineerNav,
}

const roleLabelMap: Record<UserRole, string> = {
  supervisor: '主管',
  attendant: '保洁员',
  engineer: '工程师',
}

export default function Layout({ role, userName, onLogout }: LayoutProps) {
  const navItems = navMap[role]

  return (
    <div className="flex min-h-screen">
      <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col bg-[#1E3A5F] text-white">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <Hotel size={28} className="text-[#D4A853]" />
          <span className="font-serif text-lg font-bold">客房管理系统</span>
        </div>

        <nav className="mt-2 flex-1 space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to + item.label}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          <div className="mb-2 text-sm font-medium">{userName}</div>
          <div className="mb-3 text-xs text-white/60">{roleLabelMap[role]}</div>
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut size={16} />
            <span>退出</span>
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1 bg-gray-50 p-6 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
