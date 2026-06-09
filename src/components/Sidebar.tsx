import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  DoorOpen,
  Grid3x3,
  Clock,
  Receipt,
  Search,
  ChevronLeft,
  ChevronRight,
  Anchor,
  AlertTriangle,
} from 'lucide-react'
import { useAppStore } from '@/hooks/useStore'

const navItems = [
  { path: '/', label: '工作台', icon: LayoutDashboard },
  { path: '/containers', label: '箱号清单', icon: Package },
  { path: '/gate-records', label: '闸口记录', icon: DoorOpen },
  { path: '/yard-map', label: '堆位图', icon: Grid3x3 },
  { path: '/overstay', label: '超期堆存', icon: Clock },
  { path: '/fee-review', label: '费用复核', icon: Receipt },
  { path: '/inspection', label: '查验计划', icon: Search },
  { path: '/misplaced', label: '错放箱', icon: AlertTriangle },
]

export default function Sidebar() {
  const location = useLocation()
  const { sidebarCollapsed, toggleSidebar } = useAppStore()

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <aside
      className={`${
        sidebarCollapsed ? 'w-16' : 'w-56'
      } bg-port-navy h-screen flex flex-col transition-all duration-300 shrink-0`}
    >
      <div className="flex items-center gap-2 px-4 h-16 border-b border-white/10">
        <Anchor className="w-7 h-7 text-port-orange shrink-0" />
        {!sidebarCollapsed && (
          <span className="text-white font-bold text-lg whitespace-nowrap">港口堆场</span>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              className={active ? 'sidebar-link-active' : 'sidebar-link'}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/10 p-2">
        <button
          onClick={toggleSidebar}
          className="sidebar-link w-full justify-center"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span>收起</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
