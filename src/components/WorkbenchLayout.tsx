import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useAppStore } from '@/hooks/useAppStore'
import { cn } from '@/lib/utils'
import { Package, AlertTriangle, Phone, Bell, Truck, Settings } from 'lucide-react'
import { ROLE_LABELS, type Role } from '../../shared/types'

const navItems = [
  { to: '/', label: '工作台概览', icon: Settings },
  { to: '/deliveries', label: '派件清单', icon: Package },
  { to: '/problems', label: '问题件登记', icon: AlertTriangle },
  { to: '/contacts', label: '客户联系', icon: Phone },
  { to: '/notifications', label: '异常提醒', icon: Bell },
]

const roles: { value: Role; label: string }[] = [
  { value: 'station_cs', label: ROLE_LABELS.station_cs },
  { value: 'courier', label: ROLE_LABELS.courier },
  { value: 'station_manager', label: ROLE_LABELS.station_manager },
]

const roleUserMap: Record<Role, { id: string; name: string }> = {
  station_cs: { id: 'CS001', name: '王丽娟' },
  courier: { id: 'C001', name: '张建国' },
  station_manager: { id: 'M001', name: '陈国强' },
}

export default function WorkbenchLayout() {
  const { currentUser, setCurrentUser, unreadCount } = useAppStore()
  const location = useLocation()

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-56 flex-shrink-0 bg-slate-900 text-white flex flex-col">
        <div className="px-4 py-5 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-400" />
            <h1 className="text-base font-bold">快递网点工作台</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">问题件登记与客户联系</p>
        </div>

        <nav className="flex-1 py-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors relative',
                  isActive || (item.to !== '/' && location.pathname.startsWith(item.to))
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )
              }
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
              {item.to === '/notifications' && unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-slate-700">
          <p className="text-xs text-slate-400 mb-2">当前角色</p>
          <div className="flex flex-col gap-1.5">
            {roles.map((r) => (
              <button
                key={r.value}
                onClick={() => setCurrentUser({ ...roleUserMap[r.value], role: r.value })}
                className={cn(
                  'text-left text-xs px-2.5 py-1.5 rounded transition-colors',
                  currentUser.role === r.value
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                )}
              >
                {r.label}：{roleUserMap[r.value].name}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="h-full">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
