import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Lock,
  MessageSquareQuote,
  Package,
  Users,
  Recycle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: '仪表盘', icon: LayoutDashboard, end: true },
  { to: '/adjustments', label: '调价申请', icon: FileText },
  { to: '/price-locks', label: '锁价库存', icon: Lock },
  { to: '/quotes', label: '客户报价', icon: MessageSquareQuote },
  { to: '/inventory', label: '库存管理', icon: Package },
  { to: '/customers', label: '客户管理', icon: Users },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-slate-200">
          <Recycle className="w-7 h-7 text-emerald-600" />
          <div>
            <div className="font-bold text-slate-800 text-sm leading-tight">再生资源分拣中心</div>
            <div className="text-xs text-slate-500">调价审核与库存锁价</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )
              }
            >
              <item.icon className="w-4.5 h-4.5" strokeWidth={2} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-sm">
              管
            </div>
            <div>
              <div className="text-sm font-medium text-slate-800">管理员</div>
              <div className="text-xs text-slate-500">在线</div>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-slate-800">再生资源分拣中心 · 调价审核与库存锁价系统</h1>
          <div className="text-sm text-slate-500">
            {new Date().toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </main>
    </div>
  )
}
