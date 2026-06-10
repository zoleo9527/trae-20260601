import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  FlaskConical,
  FileText,
  Wheat,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/uiStore'
import { ROLE_MAP } from '@/types'
import type { UserRole } from '@/types'

const navItems = [
  { label: '工作台', icon: LayoutDashboard, to: '/' },
  { label: '生产批次', icon: Package, to: '/batches' },
  { label: '质检留样', icon: FlaskConical, to: '/samples' },
  { label: '配方单', icon: FileText, to: '/formulas' },
  { label: '投料记录', icon: Wheat, to: '/feed-logs' },
]

const roles: UserRole[] = ['formulator', 'production_lead', 'qc_inspector', 'manager']

export default function Sidebar() {
  const { sidebarCollapsed, currentRole, toggleSidebar, setCurrentRole } = useUIStore()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-slate-900 text-white flex flex-col transition-all duration-300 z-30',
        sidebarCollapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="flex items-center justify-between px-3 py-4 border-b border-slate-700">
        {!sidebarCollapsed && (
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => setCurrentRole(role)}
                  className={cn(
                    'px-2 py-0.5 rounded text-xs transition-colors',
                    currentRole === role
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  )}
                >
                  {ROLE_MAP[role].label}
                </button>
              ))}
            </div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded hover:bg-slate-700 transition-colors shrink-0"
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 py-2">
        {navItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-2.5 mx-2 rounded transition-colors',
                isActive
                  ? 'bg-slate-800 border-l-2 border-orange-500 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white border-l-2 border-transparent'
              )
            }
          >
            <Icon size={20} className="shrink-0" />
            {!sidebarCollapsed && <span className="text-sm truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
