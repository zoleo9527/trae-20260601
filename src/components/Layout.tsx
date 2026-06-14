import { Link, useLocation, Outlet } from 'react-router-dom'
import { LayoutDashboard, FileWarning, FileCheck, Search, Download, ChevronDown } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useState, useEffect } from 'react'
import type { Role } from '../../shared/types'

const navItems = [
  { path: '/', label: '考务中心面板', icon: LayoutDashboard },
  { path: '/absence-violation', label: '缺考违纪管理', icon: FileWarning },
  { path: '/score-publish', label: '成绩发布审批', icon: FileCheck },
  { path: '/query', label: '详情查询', icon: Search },
  { path: '/export', label: '导出任务', icon: Download },
]

export default function Layout() {
  const location = useLocation()
  const { role, roleInfo, setRole } = useAppStore()
  const [showRoleMenu, setShowRoleMenu] = useState(false)

  useEffect(() => {
    if (!role) {
      setRole('admin')
    }
  }, [role, setRole])

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole)
    setShowRoleMenu(false)
  }

  return (
    <div className="flex h-screen">
      <aside className="w-60 flex-shrink-0 bg-[#1e3a5f] text-white flex flex-col">
        <div className="p-5 border-b border-white/10">
          <h1 className="text-lg font-bold">考务中心</h1>
          <p className="text-xs text-white/60 mt-1">缺考违纪与成绩发布</p>
        </div>
        <div className="relative p-4 border-b border-white/10">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="w-full flex items-center justify-between px-3 py-2 bg-white/10 rounded-md hover:bg-white/15 transition-colors text-sm"
          >
            <span>{roleInfo?.name || '选择角色'}</span>
            <ChevronDown size={14} />
          </button>
          {showRoleMenu && (
            <div className="absolute left-4 right-4 top-full mt-1 bg-white rounded-md shadow-lg z-50">
              {([
                { role: 'invigilator' as Role, label: '监考老师' },
                { role: 'admin' as Role, label: '考务专员' },
                { role: 'tech' as Role, label: '技术支持' },
              ]).map(item => (
                <button
                  key={item.role}
                  onClick={() => handleRoleChange(item.role)}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 transition-colors ${
                    role === item.role ? 'text-[#d97706] font-medium' : 'text-gray-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <nav className="flex-1 py-3">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-white/10 border-l-[3px] border-[#d97706] text-white font-medium'
                    : 'text-white/70 hover:bg-white/5 hover:text-white border-l-[3px] border-transparent'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <p className="text-xs text-white/40">考务管理系统 v1.0</p>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-[#f8fafc]">
        <Outlet />
      </main>
    </div>
  )
}
