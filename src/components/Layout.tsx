import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import {
  LayoutDashboard,
  DoorOpen,
  Wrench,
  RotateCcw,
  ScrollText,
  LogOut,
  Shield,
  HardHat,
  UserCheck,
} from 'lucide-react'

const roleLabels = {
  supervisor: { label: '客房主管', icon: Shield, color: 'text-orange-400' },
  cleaner: { label: '保洁员', icon: UserCheck, color: 'text-emerald-400' },
  engineer: { label: '工程师', icon: HardHat, color: 'text-blue-400' },
}

const navItems = [
  { path: '/', label: '工作台', icon: LayoutDashboard, roles: ['supervisor', 'cleaner', 'engineer'] },
  { path: '/rooms', label: '房态看板', icon: DoorOpen, roles: ['supervisor', 'cleaner', 'engineer'] },
  { path: '/repairs', label: '工程报修', icon: Wrench, roles: ['supervisor', 'cleaner', 'engineer'] },
  { path: '/recovery', label: '房态恢复', icon: RotateCcw, roles: ['supervisor', 'cleaner', 'engineer'] },
  { path: '/audit', label: '审计日志', icon: ScrollText, roles: ['supervisor'] },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const roleInfo = user ? roleLabels[user.role] : null
  const RoleIcon = roleInfo?.icon || Shield

  const filteredNav = navItems.filter((item) => user && item.roles.includes(user.role))

  return (
    <div className="flex h-screen bg-[#0d0f14] text-[#e4e6eb]">
      <aside className="w-[220px] flex-shrink-0 bg-[#111318] border-r border-[#1e2230] flex flex-col">
        <div className="h-14 flex items-center px-5 border-b border-[#1e2230]">
          <div className="w-7 h-7 rounded bg-[#e8723a] flex items-center justify-center mr-2.5">
            <Wrench size={14} className="text-white" />
          </div>
          <div>
            <div className="text-[13px] font-semibold text-[#e4e6eb] leading-tight">客房工程系统</div>
            <div className="text-[10px] text-[#6b7084] leading-tight">报修 · 恢复 · 追溯</div>
          </div>
        </div>

        <nav className="flex-1 py-3 px-2.5 space-y-0.5">
          {filteredNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-colors ${
                  isActive
                    ? 'bg-[#e8723a]/15 text-[#e8723a]'
                    : 'text-[#8b8fa3] hover:bg-[#1a1d28] hover:text-[#c4c7d0]'
                }`
              }
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-[#1e2230]">
          {user && roleInfo && (
            <div className="flex items-center gap-2.5 mb-2.5 px-1">
              <div className="w-8 h-8 rounded-full bg-[#1a1d28] flex items-center justify-center">
                <RoleIcon size={14} className={roleInfo.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-[#e4e6eb] truncate">{user.name}</div>
                <div className="text-[10px] text-[#6b7084]">{roleInfo.label}</div>
              </div>
            </div>
          )}
          <button
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] text-[#6b7084] hover:bg-[#1a1d28] hover:text-[#ef4444] transition-colors"
          >
            <LogOut size={13} />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
