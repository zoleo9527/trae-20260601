import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  MessageSquarePlus, 
  FileText, 
  User,
  AlertTriangle
} from 'lucide-react'
import { useAppStore } from '@/contexts/AppContext'
import { useUserStore } from '@/contexts/UserContext'
import { clsx } from 'clsx'

export function Navigation() {
  const { stuckOrders, stuckFeedbacks, incompleteAdditions } = useAppStore()
  const { currentUser } = useUserStore()
  
  const totalIssues = stuckOrders.length + stuckFeedbacks.length + incompleteAdditions.length
  
  const navItems = [
    { path: '/dashboard', label: '监控看板', icon: LayoutDashboard },
    { path: '/feedback', label: '过程反馈', icon: MessageSquarePlus },
    { path: '/addition', label: '加项记录', icon: FileText },
    { path: '/profile', label: '个人中心', icon: User },
  ]
  
  return (
    <nav className="w-64 bg-blue-900 text-white flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold">家政服务管理系统</h1>
        <p className="text-sm text-blue-200 mt-1">过程反馈与加项记录</p>
      </div>
      
      {currentUser && (
        <div className="px-6 py-4 border-t border-blue-800">
          <div className="flex items-center gap-3">
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name}
              className="w-10 h-10 rounded-full bg-blue-700"
            />
            <div>
              <p className="font-medium">{currentUser.name}</p>
              <p className="text-xs text-blue-200">
                {currentUser.role === 'customer_service' ? '客服' : 
                 currentUser.role === 'housekeeper' ? '家政员' : 
                 currentUser.role === 'quality_supervisor' ? '质检主管' : '管理员'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {totalIssues > 0 && (
        <div className="px-6 py-3 bg-orange-500 animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">
              {totalIssues} 个问题待处理
            </span>
          </div>
        </div>
      )}
      
      <div className="flex-1 py-6">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-6 py-3 transition-colors',
              isActive ? 'bg-blue-700' : 'hover:bg-blue-800'
            )}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
      
      <div className="p-6 border-t border-blue-800 text-xs text-blue-200">
        <p>模拟系统 v1.0</p>
        <p className="mt-1">数据存储于本地浏览器</p>
      </div>
    </nav>
  )
}