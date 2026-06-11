import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Calendar, Clock, CheckSquare, AlertTriangle, FileText, History, LogOut, Siren, PackageOpen, XCircle, ArrowRight, ArrowUpCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { key: 'schedule', label: '排班工作台', icon: Calendar, path: '/schedule', roles: ['counter_manager'] },
  { key: 'attendance', label: '考勤确认台', icon: Clock, path: '/attendance', roles: ['counter_manager', 'floor_supervisor', 'guide'] },
  { key: 'review', label: '复核中心', icon: CheckSquare, path: '/review', roles: ['floor_supervisor', 'brand_supervisor'] },
  { key: 'exceptions', label: '异常驾驶舱', icon: AlertTriangle, path: '/exceptions', roles: ['counter_manager', 'floor_supervisor', 'brand_supervisor', 'guide'] },
  { key: 'logs', label: '操作日志', icon: FileText, path: '/logs', roles: ['counter_manager', 'floor_supervisor', 'brand_supervisor', 'guide'] },
  { key: 'history', label: '考勤回看', icon: History, path: '/history', roles: ['counter_manager', 'floor_supervisor', 'brand_supervisor', 'guide'] },
]

const ROLE_BADGES: Record<string, { label: string; color: string }> = {
  counter_manager: { label: '柜长', color: 'bg-blue-600' },
  floor_supervisor: { label: '楼层主管', color: 'bg-amber-600' },
  brand_supervisor: { label: '品牌督导', color: 'bg-emerald-600' },
  guide: { label: '导购', color: 'bg-purple-600' },
}

const EXCEPTION_ITEMS = [
  { key: 'timeout_escalated', label: '超时升级', icon: Clock, accent: 'text-ops-danger', bg: 'bg-ops-danger/10', pulse: true },
  { key: 'review_rejected', label: '复核不通过', icon: XCircle, accent: 'text-ops-danger', bg: 'bg-ops-danger/10', pulse: true },
  { key: 'pending_material', label: '缺材料', icon: PackageOpen, accent: 'text-ops-accent', bg: 'bg-ops-accent/10', pulse: false },
  { key: 'submitted', label: '待下发', icon: ArrowUpCircle, accent: 'text-ops-info', bg: 'bg-ops-info/10', pulse: false },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const { resetData, fetchExceptionStats, exceptionStats } = useDataStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [, forceTick] = useState(0)

  if (!user) {
    navigate('/')
    return null
  }

  useEffect(() => {
    if (!user) return
    fetchExceptionStats(user.role, user.id)
    const t1 = setInterval(() => fetchExceptionStats(user.role, user.id), 15000)
    const t2 = setInterval(() => forceTick((n) => n + 1), 30000)
    return () => { clearInterval(t1); clearInterval(t2) }
  }, [fetchExceptionStats, user?.id, user?.role])

  const totalExceptions = Object.values(exceptionStats).reduce((a, b) => a + (b as number), 0)
  const hasCritical = (exceptionStats.timeout_escalated || 0) > 0 || (exceptionStats.review_rejected || 0) > 0
  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(user.role))

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleReset = async () => {
    await resetData()
    window.location.reload()
  }

  const badge = ROLE_BADGES[user.role] ?? { label: user.role, color: 'bg-gray-600' }

  return (
    <div className="flex h-screen bg-ops-dark text-gray-200">
      <aside className="w-56 flex flex-col bg-ops-card border-r border-ops-border shrink-0">
        <div className="h-14 flex items-center px-5 border-b border-ops-border">
          <span className="text-lg font-bold tracking-wide text-ops-accent">专柜排班考勤</span>
        </div>

        <nav className="flex-1 py-2 overflow-y-auto">
          {visibleNav.map((item) => {
            const active = location.pathname === item.path
            const Icon = item.icon
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                  active
                    ? 'border-l-2 border-ops-accent bg-ops-dark text-ops-accent'
                    : 'border-l-2 border-transparent text-gray-400 hover:text-gray-200 hover:bg-ops-dark/50'
                }`}
              >
                <Icon size={16} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.key === 'exceptions' && totalExceptions > 0 && (
                  <span className={cn(
                    'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold',
                    hasCritical ? 'bg-ops-danger text-white animate-pulse-red' : 'bg-ops-accent text-ops-dark'
                  )}>
                    {totalExceptions}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="border-t border-ops-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-ops-border flex items-center justify-center text-xs font-bold">
              {user.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{badge.label}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-1.5 rounded text-xs text-gray-400 hover:text-gray-200 hover:bg-ops-border/50 transition-colors"
          >
            <LogOut size={14} />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 flex items-center justify-between px-6 border-b border-ops-border bg-ops-card/50 shrink-0">
          <span className={`text-xs px-2.5 py-0.5 rounded font-medium text-white ${badge.color}`}>
            {badge.label}视角
          </span>
          <button
            onClick={handleReset}
            className="text-xs px-3 py-1 rounded border border-ops-border text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-colors"
          >
            重置数据
          </button>
        </header>

        {totalExceptions > 0 && (
          <div className={cn(
            'flex items-center gap-4 px-6 py-2.5 border-b shrink-0 transition-all',
            hasCritical ? 'bg-gradient-to-r from-ops-danger/20 via-ops-danger/10 to-transparent border-ops-danger/30' : 'bg-ops-accent/10 border-ops-accent/30'
          )}>
            <div className="flex items-center gap-2">
              <Siren size={16} className={cn(hasCritical ? 'text-ops-danger animate-pulse-red' : 'text-ops-accent')} />
              <span className={cn('text-xs font-bold', hasCritical ? 'text-ops-danger' : 'text-ops-accent')}>
                现场异常预警 · 共 {totalExceptions} 项待处理
              </span>
            </div>
            <div className="flex items-center gap-4 flex-1">
              {EXCEPTION_ITEMS.map((item) => {
                const count = exceptionStats[item.key] || 0
                if (count === 0) return null
                const Icon = item.icon
                return (
                  <div key={item.key} className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded', item.bg)}>
                    <Icon size={12} className={cn(item.accent, item.pulse && count > 0 && 'animate-pulse-red')} />
                    <span className={cn('text-xs font-mono font-bold', item.accent)}>{count}</span>
                    <span className="text-[10px] text-gray-400">{item.label}</span>
                  </div>
                )
              })}
            </div>
            <button
              onClick={() => navigate('/exceptions')}
              className="flex items-center gap-1 px-3 py-1 rounded text-xs font-medium bg-ops-dark/80 text-gray-300 hover:text-white hover:bg-ops-dark transition-colors border border-ops-border"
            >
              立即处理
              <ArrowRight size={12} />
            </button>
          </div>
        )}

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
