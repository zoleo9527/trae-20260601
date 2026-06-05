import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Shield, Mountain } from 'lucide-react'

const navItems = [
  { to: '/', label: '事件总览', icon: LayoutDashboard },
  { to: '#', label: '保险管理', icon: Shield },
  { to: '#', label: '雪场概览', icon: Mountain },
]

export default function Layout() {
  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <Mountain className="w-6 h-6 text-ice-600 mr-2" />
          <span className="text-lg font-semibold text-slate-800">雪场救援系统</span>
        </div>
        <nav className="flex-1 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center px-6 py-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-ice-50 text-ice-700 border-r-2 border-ice-600 font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`
              }
            >
              <item.icon className="w-4 h-4 mr-3" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-slate-200">
          <p className="text-xs text-slate-400">雪场应急救援管理平台 v1.0</p>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
