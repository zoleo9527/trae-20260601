import { LayoutDashboard, ClipboardCheck, CalendarClock, Car, AlertTriangle, LogOut } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { useStore } from '@/store'
import { useState } from 'react'

const navItems = [
  { to: '/', label: '仪表盘', icon: LayoutDashboard, end: true },
  { to: '/rectification', label: '不合格整改', icon: ClipboardCheck },
  { to: '/reinspection', label: '复检安排', icon: CalendarClock },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, users, switchUser } = useStore()
  const [showRole, setShowRole] = useState(false)
  const loc = useLocation()

  return (
    <div className="h-screen flex bg-ink-900 text-ink-100">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-ink-800 border-r border-ink-600 flex flex-col">
        <div className="h-12 flex items-center px-4 border-b border-ink-600">
          <Car className="w-5 h-5 text-info-400" />
          <div className="ml-2 font-mono text-sm font-bold tracking-wider text-ink-100">年检站</div>
          <span className="ml-auto text-[10px] text-ink-400">v1.0</span>
        </div>
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = item.end ? loc.pathname === item.to : loc.pathname.startsWith(item.to)
            return (
              <NavLink key={item.to} to={item.to}
                className={`flex items-center gap-2 px-3 py-2 rounded-sm text-xs transition-colors ${
                  isActive ? 'bg-info-500/15 text-info-400 border-l-2 border-info-500' : 'text-ink-300 hover:bg-ink-700 hover:text-ink-100'
                }`}>
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
        <div className="border-t border-ink-600 p-3 relative">
          <button onClick={() => setShowRole(s => !s)}
            className="w-full flex items-center gap-2 px-2 py-2 rounded-sm hover:bg-ink-700 transition-colors text-left">
            <div className="w-7 h-7 rounded-sm bg-ink-600 flex items-center justify-center text-xs font-bold text-info-300">
              {currentUser.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-ink-100 truncate">{currentUser.name}</div>
              <div className="text-[10px] text-ink-400">{currentUser.roleLabel}</div>
            </div>
            <LogOut className="w-3.5 h-3.5 text-ink-400" />
          </button>
          {showRole && (
            <div className="absolute left-3 right-3 bottom-14 bg-ink-700 border border-ink-500 rounded-sm shadow-xl z-20 overflow-hidden">
              <div className="px-3 py-1.5 text-[10px] text-ink-400 border-b border-ink-600">切换角色（演示）</div>
              {users.map(u => (
                <button key={u.id} onClick={() => { switchUser(u); setShowRole(false) }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-ink-600 ${u.id === currentUser.id ? 'text-info-400 bg-info-500/10' : 'text-ink-200'}`}>
                  <div className="w-5 h-5 rounded-sm bg-ink-600 flex items-center justify-center text-[10px] font-bold">{u.name[0]}</div>
                  <span>{u.name}</span>
                  <span className="ml-auto text-[10px] text-ink-400">{u.roleLabel}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-12 shrink-0 bg-ink-800/60 border-b border-ink-600 flex items-center px-4 gap-3">
          <div className="text-xs text-ink-300 font-mono">{new Date().toLocaleDateString('zh-CN')}</div>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-ink-300">
              <AlertTriangle className="w-3.5 h-3.5 text-warn-400" />
              <span>今日风险 3 项</span>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
