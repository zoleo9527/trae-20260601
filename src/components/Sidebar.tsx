import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FileText,
  RefreshCw,
  MessageSquare,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useAppStore } from '@/store'
import { cn } from '@/utils/helpers'
import { UserRole } from '@/types/types'

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: '仪表盘', roles: [UserRole.ACCOUNTANT, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.ADMIN] },
  { path: '/customers', icon: Users, label: '客户管理', roles: [UserRole.ACCOUNTANT, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.ADMIN] },
  { path: '/handovers', icon: FileText, label: '交接管理', roles: [UserRole.ACCOUNTANT, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.ADMIN] },
  { path: '/renewals', icon: RefreshCw, label: '续约跟进', roles: [UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.ADMIN] },
  { path: '/notes', icon: MessageSquare, label: '历史备注', roles: [UserRole.ACCOUNTANT, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.ADMIN] },
  { path: '/users', icon: Settings, label: '用户管理', roles: [UserRole.ADMIN] },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore()
  const navigate = useNavigate()

  const filteredMenuItems = menuItems.filter(
    (item) => user && item.roles.includes(user.role)
  )

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full bg-blue-900 text-white transition-all duration-300 z-50",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-blue-800">
          {!sidebarCollapsed && (
            <h1 className="text-lg font-bold">交接管理系统</h1>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-blue-800 transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="flex-1 py-4">
          {filteredMenuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 transition-colors",
                  isActive
                    ? "bg-blue-800 text-white"
                    : "text-blue-100 hover:bg-blue-800 hover:text-white",
                  sidebarCollapsed && "justify-center"
                )
              }
            >
              <item.icon size={20} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-blue-800 p-4">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full px-4 py-3 rounded-lg text-blue-100 hover:bg-blue-800 hover:text-white transition-colors",
              sidebarCollapsed && "justify-center"
            )}
          >
            <LogOut size={20} />
            {!sidebarCollapsed && <span>退出登录</span>}
          </button>
        </div>
      </div>
    </aside>
  )
}