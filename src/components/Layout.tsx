import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { PackageSearch, ClipboardCheck, Wallet, AlertTriangle, RotateCcw, Smartphone } from 'lucide-react'
import { useDeviceStore } from '@/store/deviceStore'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/receiver', label: '收货工作台', icon: PackageSearch, role: '收货员' },
  { to: '/inspector', label: '检测工作台', icon: ClipboardCheck, role: '检测师' },
  { to: '/finance', label: '财务工作台', icon: Wallet, role: '财务' },
  { to: '/risks', label: '风险标记', icon: AlertTriangle, role: '全部' },
]

export default function Layout() {
  const location = useLocation()
  const { devices, riskFlags, resetData } = useDeviceStore()
  const pendingRisks = riskFlags.filter((r) => r.status !== 'resolved').length
  const receivedCount = devices.filter((d) => d.status === 'received').length
  const inspectingCount = devices.filter((d) => d.status === 'inspecting').length

  const currentNav = navItems.find((item) => location.pathname.startsWith(item.to))

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-brand-surface border-r border-brand-border flex flex-col fixed h-full">
        <div className="p-4 border-b border-brand-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-100">数码回收店</h1>
              <p className="text-[10px] text-gray-500">设备检测与等级判定</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-brand-info text-white'
                    : 'text-gray-400 hover:bg-brand-card hover:text-gray-200'
                )
              }
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
              {item.to === '/risks' && pendingRisks > 0 && (
                <span className="ml-auto bg-brand-accent text-white text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                  {pendingRisks}
                </span>
              )}
              {item.to === '/receiver' && receivedCount > 0 && (
                <span className="ml-auto bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                  {receivedCount}
                </span>
              )}
              {item.to === '/inspector' && inspectingCount > 0 && (
                <span className="ml-auto bg-yellow-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                  {inspectingCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-brand-border space-y-2">
          <div className="text-[10px] text-gray-600 px-2">当前角色：{currentNav?.role || '—'}</div>
          <button
            onClick={resetData}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:bg-brand-card transition-colors w-full"
          >
            <RotateCcw className="w-3 h-3" />
            重置样例数据
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-56">
        <Outlet />
      </main>
    </div>
  )
}
