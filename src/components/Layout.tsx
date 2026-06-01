'use client'

import { useAuthStore } from '@/store/authStore'
import { Role } from '@prisma/client'
import {
  FileText,
  ShoppingCart,
  ClipboardCheck,
  AlertTriangle,
  LogOut,
  User,
  LayoutDashboard,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const roleLabels: Record<Role, string> = {
  [Role.PURCHASER]: '采购',
  [Role.PROCESS_ENGINEER]: '工艺工程师',
  [Role.QUALITY_INSPECTOR]: '质检',
  [Role.SUPPLIER]: '供应商',
}

const navItems = [
  { href: '/dashboard', label: '工作台', icon: LayoutDashboard },
  { href: '/drawings', label: '图纸管理', icon: FileText, roles: [Role.PROCESS_ENGINEER, Role.PURCHASER, Role.QUALITY_INSPECTOR] },
  { href: '/orders', label: '外协订单', icon: ShoppingCart, roles: [Role.PURCHASER, Role.PROCESS_ENGINEER, Role.QUALITY_INSPECTOR, Role.SUPPLIER] },
  { href: '/inspections', label: '来料检验', icon: ClipboardCheck, roles: [Role.QUALITY_INSPECTOR, Role.PURCHASER, Role.PROCESS_ENGINEER] },
  { href: '/exceptions', label: '异常处置', icon: AlertTriangle, roles: [Role.QUALITY_INSPECTOR, Role.PURCHASER, Role.PROCESS_ENGINEER, Role.SUPPLIER] },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAuthenticated } = useAuthStore()
  const pathname = usePathname()
  const router = useRouter()

  if (!isAuthenticated || !user) {
    router.push('/login')
    return null
  }

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user.role)
  )

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900">外协加工管理系统</h1>
          <p className="text-sm text-gray-500 mt-1">Outsourcing Management</p>
        </div>

        <nav className="p-4">
          <ul className="space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User size={20} className="text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{roleLabels[user.role]}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
