import { useStore } from '@/store/useStore'
import {
    ChevronLeft,
    ChevronRight,
    FolderKanban,
    LayoutDashboard,
    RotateCcw,
    Truck,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '仪表盘' },
  { to: '/projects', icon: FolderKanban, label: '项目管理' },
  { to: '/delivery', icon: Truck, label: '交付看板' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const resetData = useStore((s) => s.resetData)

  return (
    <aside
      className={`flex flex-col bg-[#12122a] border-r border-zinc-800 transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div className="flex items-center gap-2 px-4 h-14 border-b border-zinc-800">
        {!collapsed && (
          <span className="text-amber-400 font-bold text-lg tracking-wide">
            SubFlow
          </span>
        )}
        {collapsed && (
          <span className="text-amber-400 font-bold text-lg">S</span>
        )}
      </div>

      <nav className="flex-1 py-3 flex flex-col gap-1 px-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md relative transition-colors ${
                isActive
                  ? 'text-amber-400 bg-amber-400/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-amber-400 rounded-r" />
                )}
                <Icon size={20} />
                {!collapsed && <span className="text-sm">{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-zinc-800 p-2 flex flex-col gap-2">
        <button
          onClick={resetData}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <RotateCcw size={18} />
          {!collapsed && <span className="text-sm">重置演示数据</span>}
        </button>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span className="text-sm">收起侧栏</span>}
        </button>
      </div>
    </aside>
  )
}
