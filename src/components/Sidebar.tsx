import { useParcelStore } from '@/store/parcelStore'
import { AlertTriangle, ClipboardList, History, LayoutDashboard, ScanLine, Truck } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { path: '/workspace', label: '我的工作台', Icon: LayoutDashboard },
  { path: '/scan', label: '到件扫描', Icon: ScanLine },
  { path: '/dispatch', label: '派件分配', Icon: ClipboardList },
  { path: '/review', label: '派件回看', Icon: History },
  { path: '/problem', label: '问题件处理', Icon: AlertTriangle },
]

const roles = [
  { key: 'customer_service', label: '客服' },
  { key: 'courier', label: '派件员' },
  { key: 'station_manager', label: '驿站负责人' },
] as const

export default function Sidebar() {
  const { currentRole, setCurrentRole } = useParcelStore()

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-slate-900 text-white flex flex-col">
      <div className="flex items-center gap-2 px-4 py-5">
        <Truck className="h-6 w-6 text-orange-400" />
        <span className="text-lg font-bold">快递网点</span>
      </div>

      <nav className="flex-1 flex flex-col">
        {navItems.map(({ path, label, Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 hover:bg-slate-800 border-l-4 transition-colors ${
                isActive ? 'border-orange-500 bg-slate-800' : 'border-transparent'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-700 px-4 py-3">
        <label className="mb-1 block text-xs text-slate-400">切换角色</label>
        <select
          value={currentRole}
          onChange={(e) => setCurrentRole(e.target.value)}
          className="w-full rounded bg-slate-800 px-2 py-2 text-sm text-white outline-none"
        >
          {roles.map(({ key, label }) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </aside>
  )
}
