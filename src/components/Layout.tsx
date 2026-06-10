import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, MessageSquareWarning, Search, LogOut } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { USER_ROLE_LABELS } from '../../shared/types'
import type { UserRole } from '../../shared/types'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '工作台' },
  { to: '/complaints', icon: MessageSquareWarning, label: '投诉申诉' },
  { to: '/evidence', icon: Search, label: '证据回查' },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-60 flex-shrink-0 bg-park-sidebar border-r border-park-border flex flex-col">
        <div className="h-16 flex items-center px-5 border-b border-park-border">
          <LayoutDashboard className="w-6 h-6 text-park-amber mr-2" />
          <span className="text-lg font-semibold text-park-text">智慧停车场</span>
        </div>
        <nav className="flex-1 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center px-5 py-3 text-sm transition-colors border-l-[3px] ${
                  isActive
                    ? 'border-park-amber text-park-amber bg-park-hover'
                    : 'border-transparent text-park-muted hover:text-park-text hover:bg-park-hover'
                }`
              }
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-park-border p-4">
          <div className="text-sm text-park-text font-medium">{user?.name}</div>
          <div className="text-xs text-park-muted">{user?.role ? USER_ROLE_LABELS[user.role as UserRole] : ''}</div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 flex items-center justify-between px-6 border-b border-park-border bg-park-sidebar flex-shrink-0">
          <div />
          <button
            onClick={handleLogout}
            className="flex items-center text-park-muted hover:text-park-text transition-colors text-sm"
          >
            <LogOut className="w-4 h-4 mr-1" />
            退出登录
          </button>
        </header>
        <main className="flex-1 overflow-auto p-6 bg-park-bg">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
