import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { LayoutDashboard, Stethoscope, LogOut } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ROLE_LABELS } from '@/types'
import type { UserRole } from '@/types'

export default function Layout() {
  const { user, token, logout, switchRole } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSwitchRole = async (role: UserRole) => {
    try {
      await switchRole(role)
    } catch {}
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="h-screen flex bg-[#FAFAF8]">
      <aside className="w-56 bg-white border-r border-[#E5E7EB] flex flex-col">
        <div className="p-5 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#2BA88C] flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-[#1A1A1A] text-sm">面诊助手</div>
              <div className="text-xs text-[#9CA3AF]">{ROLE_LABELS[user.role]}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3">
          <button
            onClick={() => navigate('/')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
              isActive('/')
                ? 'bg-[#2BA88C]/10 text-[#2BA88C] font-medium'
                : 'text-[#6B7280] hover:bg-[#F3F4F6]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            工作台
          </button>
        </nav>

        <div className="p-3 border-t border-[#E5E7EB]">
          <div className="mb-3">
            <div className="text-xs text-[#9CA3AF] mb-2 px-1">切换角色</div>
            <div className="grid grid-cols-3 gap-1">
              {(['consultant', 'assistant', 'service'] as UserRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => handleSwitchRole(role)}
                  className={`px-2 py-1.5 rounded text-xs transition-all ${
                    user.role === role
                      ? 'bg-[#2BA88C] text-white'
                      : 'text-[#6B7280] hover:bg-[#F3F4F6]'
                  }`}
                >
                  {ROLE_LABELS[role]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 px-2 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-[#2BA88C]/10 flex items-center justify-center">
              <span className="text-xs font-medium text-[#2BA88C]">{user.name[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[#1A1A1A] truncate">{user.name}</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#6B7280] hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
