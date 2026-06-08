import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useRoleStore } from '@/stores/roleStore'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useSettlementStore } from '@/stores/settlementStore'
import { useExceptionStore } from '@/stores/exceptionStore'
import { ROLE_CONFIGS } from '@/types'
import {
  LayoutDashboard,
  CalendarClock,
  Receipt,
  AlertTriangle,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  Users,
  Shield,
} from 'lucide-react'

const navItems = [
  { path: '/', label: '工作台', icon: LayoutDashboard },
  { path: '/schedule', label: '车辆排班', icon: CalendarClock },
  { path: '/settlement', label: '用车结算', icon: Receipt },
  { path: '/exception', label: '异常说明', icon: AlertTriangle },
  { path: '/logs', label: '操作日志', icon: ScrollText },
]

const ROLE_DESCRIPTIONS: Record<string, string> = {
  dispatcher: '可创建排班、补录、重新提交结算',
  fleet_manager: '可确认出车/回车、标记异常',
  finance: '可审核结算、通过或驳回',
  supervisor: '可查看全量数据、风险看板、操作日志',
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { currentRole, switchRole, hasPermission } = useRoleStore()

  const pendingSchedules = useScheduleStore((s) => s.schedules.filter((sc) => sc.status === 'PENDING').length)
  const pendingSettlements = useSettlementStore((s) => s.settlements.filter((st) => st.status === 'PENDING_REVIEW').length)
  const rejectedSettlements = useSettlementStore((s) => s.settlements.filter((st) => st.status === 'REJECTED').length)
  const pendingExceptions = useExceptionStore((s) => s.exceptions.filter((e) => e.status === 'pending').length)

  const navBadges: Record<string, number> = {
    '/schedule': pendingSchedules,
    '/settlement': pendingSettlements + rejectedSettlements,
    '/exception': pendingExceptions,
  }

  const currentRoleConfig = ROLE_CONFIGS.find((c) => c.name === currentRole)

  return (
    <div className="flex h-screen bg-[#ecf0f5]">
      <aside
        className={`${collapsed ? 'w-16' : 'w-52'} bg-[#1a2332] flex flex-col transition-all duration-200 flex-shrink-0`}
      >
        <div className="h-14 flex items-center justify-center border-b border-white/10">
          {!collapsed && (
            <span className="text-white font-bold text-sm tracking-wide">
              车辆排班结算
            </span>
          )}
          {collapsed && <CalendarClock className="w-5 h-5 text-amber-400" />}
        </div>

        <nav className="flex-1 py-2">
          {navItems.map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path)
            const Icon = item.icon
            const badge = navBadges[item.path] || 0
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors relative ${
                  isActive
                    ? 'bg-white/10 text-amber-400 border-r-2 border-amber-400'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span>{item.label}</span>
                    {badge > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight">
                        {badge}
                      </span>
                    )}
                  </>
                )}
                {collapsed && badge > 0 && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center leading-none">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="h-10 flex items-center justify-center text-gray-500 hover:text-gray-300 border-t border-white/10"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-[#e67e22]" />
              <span className="text-sm text-gray-500">当前角色</span>
            </div>
            <select
              value={currentRole}
              onChange={(e) => switchRole(e.target.value as typeof currentRole)}
              className="text-sm font-medium text-[#1a2332] bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#e67e22]/30 focus:border-[#e67e22] transition-colors"
            >
              {ROLE_CONFIGS.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.label}
                </option>
              ))}
            </select>
            <span className="text-xs text-gray-400 max-w-[280px] truncate">
              {ROLE_DESCRIPTIONS[currentRole] || ''}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {(rejectedSettlements > 0) && (
              <div
                onClick={() => navigate('/settlement')}
                className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-2.5 py-1 cursor-pointer hover:bg-red-100 transition-colors"
              >
                <AlertTriangle size={12} />
                <span>{rejectedSettlements}笔驳回待处理</span>
              </div>
            )}
            <div className="text-xs text-gray-400">
              旅游地接社 · 车辆排班与用车结算
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
