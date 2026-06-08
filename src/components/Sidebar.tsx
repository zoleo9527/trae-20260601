import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BedDouble,
  Shirt,
  Wrench,
  PackageSearch,
  BarChart3,
  Users,
  Hotel,
  LogIn,
} from 'lucide-react'
import useStore from '@/store'

const navItems = [
  { to: '/', label: '工作台', icon: LayoutDashboard },
  { to: '/rooms', label: '房态管理', icon: BedDouble },
  { to: '/linen', label: '布草管理', icon: Shirt },
  { to: '/maintenance', label: '维修管理', icon: Wrench },
  { to: '/leftovers', label: '遗留物', icon: PackageSearch },
  { to: '/statistics', label: '数据统计', icon: BarChart3 },
  { to: '/staff', label: '人员管理', icon: Users },
]

export default function Sidebar() {
  const currentUser = useStore((s) => s.currentUser)

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-white border-r border-gray-200 flex flex-col z-30">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-gray-100">
        <Hotel size={24} style={{ color: 'var(--color-primary)' }} />
        <span
          className="text-lg font-bold"
          style={{ fontFamily: 'Georgia, serif', color: 'var(--color-primary)' }}
        >
          客房部管理
        </span>
      </div>

      <nav className="flex-1 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 h-11 text-sm transition-colors duration-200 ${
                isActive
                  ? 'border-l-3 font-semibold'
                  : 'border-l-3 border-l-transparent text-gray-600 hover:bg-gray-50'
              }`
            }
            style={({ isActive }) =>
              isActive
                ? {
                    borderLeftColor: 'var(--color-accent)',
                    color: 'var(--color-accent)',
                    backgroundColor: '#fef9ee',
                  }
                : {}
            }
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-100 px-5 py-4">
        {currentUser ? (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              {currentUser.name || currentUser.username}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {currentUser.role}
            </span>
          </div>
        ) : (
          <button
            className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-colors"
            style={{ color: 'var(--color-primary)' }}
          >
            <LogIn size={16} />
            <span>登录</span>
          </button>
        )}
      </div>
    </aside>
  )
}
