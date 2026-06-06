import { NavLink, useLocation } from 'react-router-dom'
import { useStore } from '@/store'
import {
  Home,
  Package,
  Film,
  AlertTriangle,
  BarChart3,
  Settings,
  Clapperboard,
} from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { path: '/', icon: Home, label: '首页', roles: ['frontline', 'manager', 'admin'] },
  { path: '/inventory', icon: Package, label: '卖品库存', roles: ['frontline', 'manager', 'admin'] },
  { path: '/screenings', icon: Film, label: '场次对账', roles: ['frontline', 'manager', 'admin'] },
  { path: '/exceptions', icon: AlertTriangle, label: '异常处理', roles: ['frontline', 'manager', 'admin'] },
  { path: '/audit', icon: Clapperboard, label: '回看追溯', roles: ['manager', 'admin'] },
  { path: '/reports', icon: BarChart3, label: '数据报表', roles: ['manager', 'admin'] },
  { path: '/settings', icon: Settings, label: '系统设置', roles: ['admin'] },
]

export function Sidebar() {
  const { currentUser } = useStore()
  const location = useLocation()

  const visibleItems = navItems.filter((item) => item.roles.includes(currentUser.role))

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">影院运营</h1>
        <p className="text-sm text-gray-500 mt-1">管理系统 v1.0</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                isActive
                  ? 'bg-primary-50 text-primary-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">今日日期</p>
          <p className="text-sm font-medium text-gray-900 mt-0.5">
            {new Date().toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </p>
        </div>
      </div>
    </aside>
  )
}
