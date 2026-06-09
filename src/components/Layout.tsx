import { useAppStore } from '@/hooks/useAppStore'
import { AlertTriangle, CheckCircle, ClipboardList, LayoutDashboard, User } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { ROLE_LABELS, type UserRole } from '../../shared/types'

const navItems = [
  { to: '/', label: '首页', icon: LayoutDashboard },
  { to: '/dispatch', label: '派件清单', icon: ClipboardList },
  { to: '/problems', label: '问题件', icon: AlertTriangle },
  { to: '/pickup', label: '取件核销', icon: CheckCircle },
]

const roles: UserRole[] = ['dispatcher', 'station_manager', 'customer_service']

export default function Layout() {
  const { currentRole, setCurrentRole } = useAppStore()

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-60 bg-zinc-900 text-white flex flex-col shrink-0">
        <div className="p-5 border-b border-zinc-700">
          <h1 className="text-lg font-bold text-primary-400">驿站入库核销</h1>
          <p className="text-xs text-zinc-400 mt-1">快递网点管理系统</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-primary-700 text-white font-medium'
                    : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-700">
          <div className="flex items-center gap-2 mb-3">
            <User size={14} className="text-zinc-400" />
            <span className="text-xs text-zinc-400">当前角色</span>
          </div>
          <div className="space-y-1">
            {roles.map(role => (
              <button
                key={role}
                onClick={() => setCurrentRole(role)}
                className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors ${
                  currentRole === role
                    ? 'bg-primary-600 text-white font-medium'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                {ROLE_LABELS[role]}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
