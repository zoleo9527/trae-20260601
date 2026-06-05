import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'
import {
    Beer,
    History,
    LayoutDashboard,
    LogOut,
    Package,
    Truck
} from 'lucide-react'
import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

const roleDisplayNames: Record<string, string> = {
  SALES: '销售内勤',
  BREWER: '酿酒师',
  PACKER: '包装主管',
  ADMIN: '管理员',
}

const navItems = [
  { path: '/', icon: LayoutDashboard, label: '工作台' },
  { path: '/orders', icon: Package, label: '经销订单' },
  { path: '/shipments', icon: Truck, label: '发货跟踪' },
  { path: '/logs', icon: History, label: '操作日志' },
]

interface LayoutProps {
  children: React.ReactNode
  title?: string
}

export default function Layout({ children, title }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  if (!user) {
    return null
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-stone-50">
      <aside className="w-56 bg-stone-900 flex flex-col">
        <div className="p-4 border-b border-stone-800">
          <div className="flex items-center gap-2 text-amber-500">
            <Beer className="w-8 h-8" />
            <span className="text-xl font-bold text-white">精酿酒厂</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path))
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-amber-600 text-white'
                    : 'text-stone-400 hover:text-white hover:bg-stone-800'
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-stone-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-white">{user.displayName}</p>
              <p className="text-xs text-stone-400">{roleDisplayNames[user.role] || user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {title && (
          <header className="bg-white border-b border-stone-200 px-6 py-4">
            <h1 className="text-xl font-semibold text-stone-900">{title}</h1>
          </header>
        )}
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </main>
    </div>
  )
}
