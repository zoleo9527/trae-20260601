import { useState, useEffect } from 'react'
import { Outlet, useLocation, Link } from 'react-router-dom'
import { LayoutDashboard, Calendar, Package, AlertTriangle, ArrowRightLeft, Mountain } from 'lucide-react'

const navItems = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/bookings', label: '课程预约', icon: Calendar },
  { path: '/equipment', label: '装备发放', icon: Package },
  { path: '/anomalies', label: '异常记录', icon: AlertTriangle },
  { path: '/handover', label: '交班面板', icon: ArrowRightLeft },
]

function formatDateTime(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}:${s}`
}

export default function Layout() {
  const location = useLocation()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-rock-gray text-white flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-gray-600">
          <div className="flex items-center gap-2">
            <Mountain className="w-7 h-7 text-climbing-orange" />
            <h1 className="text-xl font-bold">攀岩馆运营</h1>
          </div>
        </div>
        <nav className="flex-1 py-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-climbing-orange text-white'
                    : 'text-gray-300 hover:bg-gray-600 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="px-6 py-4 border-t border-gray-600 text-xs text-gray-400">
          攀岩馆运营管理系统 v1.0
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <h2 className="text-sm text-gray-500">
            {navItems.find((n) => n.path === location.pathname)?.label || '仪表盘'}
          </h2>
          <span className="text-sm text-gray-500">{formatDateTime(now)}</span>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
