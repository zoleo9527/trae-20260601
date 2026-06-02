import { useStore } from '@/store/useStore'
import {
    AlertTriangle,
    Bell,
    Calendar,
    Clock,
    FlaskConical,
    GraduationCap,
    ListOrdered,
    Settings,
    Shield,
    Users,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: '仪器日历', icon: Calendar },
  { to: '/queue', label: '预约队列', icon: ListOrdered },
  { to: '/samples', label: '样本登记', icon: FlaskConical },
  { to: '/downtime', label: '故障停机', icon: AlertTriangle },
  { to: '/postpone', label: '顺延处理', icon: Clock },
  { to: '/notifications', label: '通知记录', icon: Bell },
  { to: '/settings', label: '设置', icon: Settings },
]

const roleLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  admin: { label: '管理员', icon: Shield, color: 'text-emerald-400' },
  leader: { label: '课题组负责人', icon: Users, color: 'text-blue-400' },
  student: { label: '学生', icon: GraduationCap, color: 'text-amber-400' },
}

export default function Layout() {
  const { currentRole, notifications } = useStore()
  const unreadCount = notifications.filter((n) => !n.read).length
  const roleInfo = roleLabels[currentRole]

  return (
    <div className="flex h-screen">
      <aside className="w-[200px] bg-[#12122a] border-r border-[#1e1e3a] flex flex-col shrink-0">
        <div className="h-12 flex items-center px-4 border-b border-[#1e1e3a]">
          <span className="text-sm font-bold text-zinc-100 tracking-wide">仪器预约管理台</span>
        </div>
        <nav className="flex-1 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 text-[13px] transition-colors ${
                  isActive
                    ? 'bg-[#1a1a3a] text-zinc-100 border-l-2 border-blue-500'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#16162e]'
                }`
              }
            >
              <item.icon size={16} />
              <span>{item.label}</span>
              {item.to === '/notifications' && unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">
                  {unreadCount}
                </span>
              )}
              {item.to === '/postpone' && (
                <PostponeBadge />
              )}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-[#1e1e3a] px-4 py-3">
          <div className="flex items-center gap-2">
            <roleInfo.icon size={14} className={roleInfo.color} />
            <span className={`text-xs ${roleInfo.color}`}>{roleInfo.label}</span>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-12 bg-[#12122a] border-b border-[#1e1e3a] flex items-center px-6 shrink-0">
          <h1 className="text-sm font-semibold text-zinc-200">
            {navItems.find((n) => n.to === location.pathname)?.label || '仪器预约管理台'}
          </h1>
        </header>
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function PostponeBadge() {
  const reservations = useStore((s) => s.reservations)
  const count = reservations.filter((r) => r.status === 'postponed').length
  if (count === 0) return null
  return (
    <span className="ml-auto bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.5 rounded-full leading-none">
      {count}
    </span>
  )
}
