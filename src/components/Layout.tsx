import { useEffect, useMemo } from 'react'
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  AlertTriangle,
  ArrowRightLeft,
  Bell,
  LogOut,
  User,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'

const ROLE_LABELS: Record<string, string> = {
  volunteer: '志愿者',
  vet: '兽医',
  adoption_officer: '领养专员',
  admin: '管理员',
}

interface NavItem {
  label: string
  icon: React.ReactNode
  path: string
  roles: string[]
}

const NAV_ITEMS: NavItem[] = [
  {
    label: '仪表盘',
    icon: <LayoutDashboard size={20} />,
    path: '/dashboard',
    roles: ['volunteer', 'vet', 'adoption_officer', 'admin'],
  },
  {
    label: '救助档案',
    icon: <FileText size={20} />,
    path: '/rescues',
    roles: ['volunteer', 'vet', 'adoption_officer', 'admin'],
  },
  {
    label: '回访记录',
    icon: <ClipboardCheck size={20} />,
    path: '/visits',
    roles: ['volunteer', 'vet', 'adoption_officer', 'admin'],
  },
  {
    label: '异常收回',
    icon: <AlertTriangle size={20} />,
    path: '/recalls',
    roles: ['adoption_officer', 'admin'],
  },
  {
    label: '交班中心',
    icon: <ArrowRightLeft size={20} />,
    path: '/handovers',
    roles: ['volunteer', 'vet', 'adoption_officer', 'admin'],
  },
]

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': '仪表盘',
  '/rescues': '救助档案',
  '/visits': '回访记录',
  '/recalls': '异常收回',
  '/handovers': '交班中心',
}

function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/rescues')) return '救助档案'
  if (pathname.startsWith('/visits')) return '回访记录'
  if (pathname.startsWith('/recalls')) return '异常收回'
  if (pathname.startsWith('/handovers')) return '交班中心'
  return PAGE_TITLES[pathname] ?? ''
}

export default function Layout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage)
  const notifications = useNotificationStore((s) => s.notifications)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications)
  const markAllRead = useNotificationStore((s) => s.markAllRead)

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  useEffect(() => {
    if (user) {
      fetchNotifications(user.id)
    }
  }, [user, fetchNotifications])

  const visibleNavItems = useMemo(
    () => NAV_ITEMS.filter((item) => user && item.roles.includes(user.role)),
    [user]
  )

  const pageTitle = getPageTitle(pathname)

  function handleLogout() {
    logout()
    navigate('/')
  }

  function handleBellClick() {
    if (user && unreadCount > 0) {
      markAllRead(user.id)
    }
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-60 bg-[#1F2937] text-white flex flex-col flex-shrink-0">
        <div className="px-5 py-6 border-b border-gray-700">
          <h1 className="text-lg font-bold">🐾 救助站管理</h1>
        </div>

        <nav className="flex-1 py-4">
          {visibleNavItems.map((item) => {
            const isActive =
              item.path === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.path)
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-[#E8722A] text-white font-medium'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="border-t border-gray-700 px-5 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
              <User size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-gray-400">{ROLE_LABELS[user.role] ?? user.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">{pageTitle}</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={handleBellClick}
              className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User size={16} />
              <span>{user.name}</span>
              <span className="text-gray-400">|</span>
              <span className="text-orange-600">{ROLE_LABELS[user.role]}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
