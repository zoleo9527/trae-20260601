import { Outlet, NavLink } from 'react-router-dom'
import { Ship, Truck } from 'lucide-react'

const navItems = [
  { to: '/gate-releases', label: '闸口放行', icon: Ship },
  { to: '/fleet-appointments', label: '车队预约', icon: Truck },
]

export default function Layout() {
  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-primary-800 text-white flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-primary-700">
          <h1 className="text-xl font-bold tracking-wide">港口堆场</h1>
          <p className="text-primary-200 text-sm mt-1">闸口放行与车队预约</p>
        </div>
        <nav className="flex-1 py-4">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-900 text-white'
                    : 'text-primary-100 hover:bg-primary-700 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-primary-700 text-xs text-primary-300">
          港口堆场管理系统 v1.0
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-gray-50 p-6">
        <Outlet />
      </main>
    </div>
  )
}
