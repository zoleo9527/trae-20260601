import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, AlertTriangle, Scale, Clock, ChevronRight, Plane } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: '工作台' },
  { to: '/damage', icon: AlertTriangle, label: '异常货损' },
  { to: '/liability', icon: Scale, label: '责任认定' },
  { to: '/history', icon: Clock, label: '历史记录' },
]

export default function Layout() {
  const location = useLocation()

  const breadcrumbs: { label: string; to?: string }[] = (() => {
    const path = location.pathname
    if (path.startsWith('/damage/')) return [{ label: '异常货损', to: '/damage' }, { label: '详情' }]
    if (path.startsWith('/liability/')) return [{ label: '责任认定', to: '/liability' }, { label: '详情' }]
    if (path === '/damage') return [{ label: '异常货损' }]
    if (path === '/liability') return [{ label: '责任认定' }]
    if (path === '/history') return [{ label: '历史记录' }]
    return [{ label: '工作台' }]
  })()

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-60 flex-shrink-0 bg-surface-900 text-white flex flex-col">
        <div className="h-14 flex items-center gap-3 px-5 border-b border-surface-700/50">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <Plane className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">民航货站</div>
            <div className="text-[11px] text-surface-400 leading-tight">异常货损与责任认定</div>
          </div>
        </div>
        <nav className="flex-1 py-3 px-3 space-y-0.5">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-600/20 text-brand-400'
                    : 'text-surface-300 hover:bg-surface-800 hover:text-white'
                )
              }
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-surface-700/50">
          <div className="text-xs text-surface-500">当前操作员</div>
          <div className="text-sm text-surface-300 mt-0.5">张伟 · 货站值班</div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-12 flex items-center gap-2 px-6 border-b border-surface-200 bg-white text-sm text-surface-500 flex-shrink-0">
          {breadcrumbs.map((bc, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-surface-300" />}
              {bc.to ? (
                <NavLink to={bc.to} className="hover:text-brand-600 transition-colors">
                  {bc.label}
                </NavLink>
              ) : (
                <span className="text-surface-800 font-medium">{bc.label}</span>
              )}
            </span>
          ))}
        </header>

        <main className="flex-1 overflow-y-auto bg-surface-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
