import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Ticket,
  Users,
  Package,
  Upload,
  LogOut,
  Menu,
} from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: '首页' },
  { path: '/coupons', icon: Ticket, label: '促销券' },
  { path: '/members', icon: Users, label: '会员档案' },
  { path: '/batches', icon: Package, label: '批号管理' },
  { path: '/attachments', icon: Upload, label: '附件管理' },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  const roleLabels = {
    clerk: '店员',
    manager: '店长',
    buyer: '采购',
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {sidebarOpen && (
            <h1 className="text-lg font-bold text-primary">促销券管理</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 py-4">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 mx-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon size={20} />
                {sidebarOpen && <span className="ml-3">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className={`flex items-center ${!sidebarOpen && 'justify-center'}`}>
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary font-medium">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            {sidebarOpen && (
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-500">
                  {roleLabels[user?.role || 'clerk']}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`mt-4 w-full flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ${
              !sidebarOpen && 'justify-center'
            }`}
          >
            <LogOut size={18} />
            {sidebarOpen && <span className="ml-3">退出登录</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
