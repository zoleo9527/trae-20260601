import { ChevronLeft, ChevronRight, ClipboardCheck, FileX, Layers, LayoutDashboard, Tag, Users } from 'lucide-react'
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/', label: '总览', icon: LayoutDashboard },
  { to: '/registrations', label: '报名名单', icon: Users },
  { to: '/groups', label: '分组管理', icon: Layers },
  { to: '/bibs', label: '号码布发放', icon: Tag },
  { to: '/checkin', label: '现场检录', icon: ClipboardCheck },
  { to: '/withdrawals', label: '退赛记录', icon: FileX },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  return (
    <aside className={`flex flex-col bg-[#12121f] border-r border-zinc-800 transition-all duration-200 ${collapsed ? 'w-14' : 'w-48'}`}>
      <div className={`flex items-center h-12 border-b border-zinc-800 px-3 ${collapsed ? 'justify-center' : ''}`}>
        {!collapsed && <span className="text-sm font-bold text-orange-500 tracking-wider">赛事后台</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`${collapsed ? '' : 'ml-auto'} p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200`}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
      <nav className="flex-1 py-2">
        {navItems.map(item => {
          const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 mx-2 px-2 py-2 rounded text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-orange-500/15 text-orange-400'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={16} className={collapsed ? 'mx-auto' : ''} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>
      <div className="border-t border-zinc-800 px-3 py-2">
        {!collapsed && <div className="text-[10px] text-zinc-600">v1.0 · 2026 城市趣味赛</div>}
      </div>
    </aside>
  )
}
