import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, GitBranch, Bell, ChevronLeft, ChevronRight, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore, type Role } from '@/stores/appStore'

const navItems = [
  { to: '/', label: '今日看板', icon: LayoutDashboard },
  { to: '/diversion', label: '导检分流', icon: GitBranch },
  { to: '/missed', label: '漏项提醒', icon: Bell },
]

const roles: { value: Role; label: string }[] = [
  { value: 'front_desk', label: '前台导检' },
  { value: 'doctor', label: '科室医生' },
  { value: 'reviewer', label: '报告审核' },
]

export default function Layout() {
  const { currentRole, setCurrentRole, sidebarCollapsed, toggleSidebar } = useAppStore()
  const location = useLocation()

  return (
    <div className="flex h-screen bg-warm-bg font-sans">
      <aside
        className={cn(
          'flex flex-col bg-primary text-white transition-all duration-300 shrink-0',
          sidebarCollapsed ? 'w-16' : 'w-60'
        )}
      >
        <div className={cn(
          'flex items-center h-16 px-4 border-b border-white/10',
          sidebarCollapsed ? 'justify-center' : 'justify-between'
        )}>
          {!sidebarCollapsed && (
            <span className="text-lg font-bold tracking-wide">导检分流系统</span>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 py-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={cn(
                  'flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white',
                  sidebarCollapsed && 'justify-center px-0 mx-1'
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        <div className={cn(
          'p-4 border-t border-white/10',
          sidebarCollapsed && 'px-2'
        )}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 mb-2 text-xs text-white/50">
              <User className="w-3.5 h-3.5" />
              <span>当前角色</span>
            </div>
          )}
          <div className={cn('flex gap-1', sidebarCollapsed && 'flex-col')}>
            {roles.map((r) => (
              <button
                key={r.value}
                onClick={() => setCurrentRole(r.value)}
                className={cn(
                  'px-2 py-1 rounded text-xs font-medium transition-colors',
                  currentRole === r.value
                    ? 'bg-accent text-primary-dark'
                    : 'bg-white/10 text-white/70 hover:bg-white/20',
                  sidebarCollapsed && 'text-center'
                )}
                title={r.label}
              >
                {sidebarCollapsed ? r.label[0] : r.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-warm-300 flex items-center px-6 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">当前角色：</span>
            <span className="text-sm font-semibold text-primary">
              {roles.find((r) => r.value === currentRole)?.label}
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
