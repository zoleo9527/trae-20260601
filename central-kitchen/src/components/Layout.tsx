import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  Table2,
  Factory,
  Store,
  AlertTriangle,
  History,
  User,
  ChevronDown,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'
import { useAuthStore } from '@/store/authStore'
import { ROLE_PERMISSIONS, ROLE_LABELS } from '@/constants/statusMachine'
import type { Role } from '@/types'

interface MenuItem {
  id: string
  label: string
  path: string
  icon: React.ElementType
}

const ALL_MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: '工作台', path: '/dashboard', icon: LayoutDashboard },
  { id: 'meal-orders', label: '门店配餐', path: '/meal-orders', icon: ClipboardList },
  { id: 'batch-entry', label: '批量录入', path: '/batch-entry', icon: Table2 },
  { id: 'production-board', label: '生产白板', path: '/production-board', icon: Factory },
  { id: 'store-report', label: '门店报量', path: '/store-report', icon: Store },
  { id: 'shortage-review', label: '缺货补发', path: '/shortage-review', icon: AlertTriangle },
  { id: 'shortage-history', label: '补发记录', path: '/shortage-history', icon: History },
]

export function Layout() {
  const { currentUser, switchRole, canAccessMenu } = useAuthStore()
  const [showRoleMenu, setShowRoleMenu] = useState(false)
  const navigate = useNavigate()

  if (!currentUser) return null

  const menuItems = ALL_MENU_ITEMS.filter((item) => canAccessMenu(item.id))

  const handleRoleSwitch = (role: Role) => {
    switchRole(role)
    setShowRoleMenu(false)
    navigate('/dashboard')
  }

  return (
    <div className="flex h-full bg-neutral-50">
      <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col">
        <div className="h-16 px-6 flex items-center border-b border-neutral-200">
          <h1 className="text-lg font-bold text-primary-700">中央厨房</h1>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  )
                }
              >
                <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="p-3 border-t border-neutral-200">
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <div className="flex items-center">
                <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div className="ml-3 text-left">
                  <p className="text-sm font-medium text-neutral-900">
                    {currentUser.name}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {ROLE_LABELS[currentUser.role]}
                  </p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg border border-neutral-200 shadow-lg overflow-hidden">
                <div className="px-3 py-2 text-xs font-medium text-neutral-500 bg-neutral-50 border-b border-neutral-200">
                  切换角色（演示用）
                </div>
                {(['purchase_manager', 'production_leader', 'store_supervisor'] as Role[]).map(
                  (role) => (
                    <button
                      key={role}
                      onClick={() => handleRoleSwitch(role)}
                      className={clsx(
                        'w-full flex items-center px-3 py-2.5 text-sm hover:bg-neutral-50 transition-colors',
                        currentUser.role === role
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-neutral-700'
                      )}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      {ROLE_LABELS[role]}
                      <span className="ml-auto text-xs text-neutral-400">
                        {ROLE_PERMISSIONS[role].description}
                      </span>
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-neutral-200 px-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              {ROLE_LABELS[currentUser.role]}工作台
            </h2>
            <p className="text-xs text-neutral-500">
              {ROLE_PERMISSIONS[currentUser.role].description}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-neutral-500">
              今天是 {new Date().toLocaleDateString('zh-CN')}
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
