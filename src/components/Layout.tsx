import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  ClipboardList, 
  Package, 
  Settings,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  Wrench
} from 'lucide-react'
import { useAppStore } from '../store'

const navItems = [
  { icon: LayoutDashboard, path: '/', label: '首页' },
  { icon: ClipboardList, path: '/orders', label: '接机单管理' },
  { icon: Package, path: '/spare-parts', label: '备件管理' },
  { icon: Settings, path: '/reset-data', label: '数据重置' }
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const location = useLocation()
  const currentUser = useAppStore(state => state.currentUser)
  const setCurrentUser = useAppStore(state => state.setCurrentUser)

  const userOptions = [
    { id: 'front-001', name: '前台-王芳', role: 'front' as const },
    { id: 'tech-001', name: '维修师-刘强', role: 'technician' as const },
    { id: 'mgr-001', name: '店长-张伟', role: 'manager' as const }
  ]

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'front': return <Phone className="w-4 h-4" />
      case 'technician': return <Wrench className="w-4 h-4" />
      case 'manager': return <User className="w-4 h-4" />
      default: return <User className="w-4 h-4" />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <aside 
        className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-blue-800 text-white flex flex-col transition-all duration-300`}
      >
        <div className="p-4 border-b border-blue-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <Wrench className="w-6 h-6" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="font-bold text-lg">手机维修店</h1>
                <p className="text-blue-200 text-sm">取机质检系统</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-blue-700 text-blue-100'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-blue-700">
          <div className="relative">
            <select
              value={currentUser.id}
              onChange={(e) => {
                const option = userOptions.find(o => o.id === e.target.value)
                if (option) setCurrentUser(option)
              }}
              className="w-full bg-blue-700 text-white border-none rounded-lg px-3 py-2 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              {userOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
              {getRoleIcon(currentUser.role)}
            </div>
          </div>
        </div>

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-3 border-t border-blue-700 hover:bg-blue-700 transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="w-5 h-5 mx-auto" /> : <ChevronLeft className="w-5 h-5 mx-auto" />}
        </button>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {navItems.find(item => location.pathname === item.path)?.label || '首页'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                当前用户: {currentUser.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">{new Date().toLocaleDateString('zh-CN')}</p>
            </div>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}