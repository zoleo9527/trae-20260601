import { NavLink, useLocation } from 'react-router-dom'
import { Package, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'

const navItems = [
  { path: '/', label: '出库单列表', icon: Package },
  { path: '/batch-issues', label: '批号异常工单', icon: AlertTriangle },
]

const roleConfig = {
  sales: '销售内勤',
  warehouse: '仓库员',
  aftersales: '售后专员',
} as const

export default function Sidebar() {
  const { currentRole, setCurrentRole } = useAppStore()
  const location = useLocation()

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-indigo-950 text-white flex flex-col z-50">
      <div className="px-5 py-6 border-b border-indigo-900">
        <h1 className="text-lg font-bold tracking-wide">口腔耗材出库管理</h1>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/' || location.pathname.startsWith('/outbound')
              : location.pathname.startsWith(item.path)
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-700 text-white'
                  : 'text-indigo-200 hover:bg-indigo-900 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="px-5 py-4 border-t border-indigo-900">
        <p className="text-xs text-indigo-300 mb-2">当前角色</p>
        <div className="space-y-1.5">
          {(Object.entries(roleConfig) as [keyof typeof roleConfig, string][]).map(
            ([role, label]) => (
              <label
                key={role}
                className="flex items-center gap-2 cursor-pointer text-sm"
              >
                <input
                  type="radio"
                  name="role"
                  value={role}
                  checked={currentRole === role}
                  onChange={() => setCurrentRole(role)}
                  className="accent-amber-500"
                />
                <span
                  className={cn(
                    currentRole === role ? 'text-amber-400 font-medium' : 'text-indigo-200'
                  )}
                >
                  {label}
                </span>
              </label>
            )
          )}
        </div>
      </div>
    </aside>
  )
}
