import { useState, useEffect } from 'react'
import { Outlet, useNavigate, NavLink, Navigate } from 'react-router-dom'
import { useUserStore } from '@/stores/userStore'
import { useRecentStore } from '@/stores/recentStore'
import { ROLE_LABELS } from '@/types'
import { LayoutDashboard, AlertTriangle, RefreshCw, Clock, LogOut, Heart, History, WifiOff } from 'lucide-react'

const navItems = [
  { to: '/', label: '工作台', icon: LayoutDashboard },
  { to: '/warnings', label: '临期预警', icon: AlertTriangle },
  { to: '/exchanges', label: '换货处理', icon: RefreshCw },
  { to: '/history', label: '操作历史', icon: Clock },
  { to: '/recent', label: '最近打开', icon: History },
]

export default function Layout() {
  const navigate = useNavigate()
  const { currentUser, logout } = useUserStore()
  const getByUser = useRecentStore((s) => s.getByUser)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  const recentItems = getByUser(currentUser.id).slice(0, 5)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen">
      <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-slate-800 flex flex-col">
        <div className="p-5 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-amber-500" />
            <span className="text-lg font-bold text-white">口腔耗材管理</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">临期预警与换货处理系统</p>
        </div>

        <nav className="flex-1 py-4">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-slate-700/50 border-l-2 border-amber-500 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </NavLink>
          ))}

          {recentItems.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <p className="px-5 text-xs text-slate-500 mb-2">最近访问</p>
              {recentItems.map((item) => {
                const isWarning = item.itemType === 'warning'
                const path = isWarning
                  ? `/warnings/${item.itemId}`
                  : `/exchanges/${item.itemId}`
                return (
                  <NavLink
                    key={item.id}
                    to={path}
                    className="flex items-center gap-2 px-5 py-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors truncate"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isWarning ? 'bg-amber-500' : 'bg-blue-500'
                      }`}
                    />
                    <span className="truncate">{item.itemTitle}</span>
                  </NavLink>
                )
              })}
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-700">
          {isOffline && (
            <div className="flex items-center gap-2 mb-3 px-2 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs text-amber-400">离线模式 · 数据已本地保存</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">{currentUser.name}</p>
              <p className="text-xs text-slate-400">{ROLE_LABELS[currentUser.role]}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">轻账号 · 非真实认证</p>
          <div className="mt-2 pt-2 border-t border-slate-700/50 space-y-1">
            <p className="text-xs text-slate-600 leading-relaxed">第三方通知：未接入，仅页面内提醒</p>
            <p className="text-xs text-slate-600 leading-relaxed">附件上传：仅记录文件名，非真实存储</p>
            <p className="text-xs text-slate-600 leading-relaxed">数据存储：localStorage 本地持久化</p>
          </div>
        </div>
      </aside>

      <main className="ml-[240px] min-h-screen bg-slate-900 p-6">
        <Outlet />
      </main>
    </div>
  )
}
