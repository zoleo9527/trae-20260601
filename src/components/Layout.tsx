import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Archive,
  Layers,
  Bell,
  ChevronsLeft,
  ChevronsRight,
  Stethoscope,
  HeartPulse,
  ShieldCheck,
  ChevronDown,
  User,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { Role } from '@/lib/types'
import { ROLE_LABELS, ROLE_USERS } from '@/lib/types'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { path: '/', label: '工作台', icon: LayoutDashboard },
  { path: '/contracts', label: '家庭签约', icon: FileText },
  { path: '/archives', label: '档案建档', icon: Archive },
  { path: '/batch', label: '批量录入', icon: Layers },
]

const ROLE_ICONS: Record<Role, typeof Stethoscope> = {
  doctor: Stethoscope,
  nurse: HeartPulse,
  public_health: ShieldCheck,
}

const ROLE_COLORS: Record<Role, string> = {
  doctor: 'bg-primary-700',
  nurse: 'bg-blue-600',
  public_health: 'bg-amber-600',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { currentRole, currentUser, sidebarCollapsed, notifications, setRole, setUser, toggleSidebar, fetchNotifications } = useAppStore()
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false)

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 15000)
    return () => clearInterval(interval)
  }, [currentRole, fetchNotifications])

  const unreadCount = notifications.filter((n) => n.is_read === 0).length
  const RoleIcon = ROLE_ICONS[currentRole]

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <aside
        className={cn(
          'flex flex-col border-r border-zinc-200 bg-white transition-all duration-200',
          sidebarCollapsed ? 'w-16' : 'w-56'
        )}
      >
        <div className={cn('flex h-14 items-center border-b border-zinc-100 px-3', sidebarCollapsed ? 'justify-center' : 'gap-2.5')}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-700 text-white">
            <FileText size={16} strokeWidth={2.5} />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-zinc-900">社区卫生站</div>
              <div className="truncate text-[10px] text-zinc-400">签约与建档管理</div>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-0.5 px-2 py-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700',
                  sidebarCollapsed && 'justify-center px-0'
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon size={18} />
                {!sidebarCollapsed && <span>{item.label}</span>}
                {item.path === '/' && unreadCount > 0 && !sidebarCollapsed && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-600 px-1 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-zinc-100 px-2 py-3">
          <button
            onClick={toggleSidebar}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600"
          >
            {sidebarCollapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
            {!sidebarCollapsed && <span>收起侧栏</span>}
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-5">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-zinc-800">
              {NAV_ITEMS.find((item) => item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path))?.label || '社区卫生站'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="relative flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-600"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-600 px-0.5 text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </Link>

            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors',
                  roleDropdownOpen ? 'bg-zinc-100' : 'hover:bg-zinc-50'
                )}
              >
                <div className={cn('flex h-6 w-6 items-center justify-center rounded-md text-white', ROLE_COLORS[currentRole])}>
                  <RoleIcon size={12} />
                </div>
                <div className="text-left">
                  <div className="text-xs font-medium text-zinc-700">{currentUser}</div>
                  <div className="text-[10px] text-zinc-400">{ROLE_LABELS[currentRole]}</div>
                </div>
                <ChevronDown size={12} className="text-zinc-400" />
              </button>

              {roleDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setRoleDropdownOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-1 w-60 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg">
                    {(Object.keys(ROLE_LABELS) as Role[]).map((role) => {
                      const RIcon = ROLE_ICONS[role]
                      const users = ROLE_USERS[role]
                      return (
                        <div key={role} className="mb-1 last:mb-0">
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                            <RIcon size={10} />
                            {ROLE_LABELS[role]}
                          </div>
                          {users.map((u) => (
                            <button
                              key={u.id}
                              onClick={() => {
                                setRole(role)
                                setUser(u.name)
                                setRoleDropdownOpen(false)
                              }}
                              className={cn(
                                'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors',
                                currentRole === role && currentUser === u.name
                                  ? 'bg-primary-50 text-primary-700 font-medium'
                                  : 'text-zinc-600 hover:bg-zinc-50'
                              )}
                            >
                              <User size={12} />
                              {u.name}
                            </button>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-5 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  )
}
