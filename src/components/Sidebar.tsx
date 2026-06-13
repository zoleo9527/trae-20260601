import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { 
  LayoutDashboard, 
  FileCheck, 
  Rocket, 
  Calendar, 
  RotateCcw, 
  LogOut,
  Briefcase
} from 'lucide-react'

const navItems = {
  operator: [
    { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'audit', label: '岗位审核', icon: FileCheck, path: '/jobs/pending' },
    { id: 'reset', label: '数据重置', icon: RotateCcw, path: '/reset' },
  ],
  consultant: [
    { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'manage', label: '发布管理', icon: Rocket, path: '/jobs/manage' },
    { id: 'interviews', label: '面试管理', icon: Calendar, path: '/interviews' },
  ],
  hr: [
    { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'manage', label: '岗位管理', icon: Briefcase, path: '/jobs/manage' },
    { id: 'interviews', label: '面试管理', icon: Calendar, path: '/interviews' },
  ],
}

export default function Sidebar() {
  const user = useAuthStore(state => state.user)
  const logout = useAuthStore(state => state.logout)
  const navigate = useNavigate()
  const location = useLocation()

  if (!user) return null

  const items = navItems[user.role] || []

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleLabels: Record<string, string> = {
    operator: '运营',
    consultant: '招聘顾问',
    hr: '企业HR',
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-800">蓝领招聘平台</h1>
            <p className="text-xs text-gray-500">岗位审核与发布管理</p>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold">{user.username.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p className="font-medium text-gray-800">{user.username}</p>
            <p className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block">
              {roleLabels[user.role]}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {items.map(item => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <li key={item.id}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors duration-200"
        >
          <LogOut className="w-5 h-5" />
          退出登录
        </button>
      </div>
    </aside>
  )
}