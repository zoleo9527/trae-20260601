import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/stores/userStore'
import { ROLE_LABELS, ROLE_DESCRIPTIONS, type UserRole } from '@/types'
import { UserCheck, Warehouse, HeadsetIcon } from 'lucide-react'

const ROLE_CONFIG: {
  role: UserRole
  icon: React.ComponentType<{ className?: string }>
  accent: string
  borderHover: string
  iconColor: string
}[] = [
  {
    role: 'sales',
    icon: UserCheck,
    accent: 'amber-500',
    borderHover: 'hover:border-amber-500',
    iconColor: 'text-amber-500',
  },
  {
    role: 'warehouse',
    icon: Warehouse,
    accent: 'blue-500',
    borderHover: 'hover:border-blue-500',
    iconColor: 'text-blue-500',
  },
  {
    role: 'aftersales',
    icon: HeadsetIcon,
    accent: 'emerald-500',
    borderHover: 'hover:border-emerald-500',
    iconColor: 'text-emerald-500',
  },
]

const PREDEFINED_USERS: Record<UserRole, { id: string; name: string }> = {
  sales: { id: 'u1', name: '张丽' },
  warehouse: { id: 'u2', name: '王刚' },
  aftersales: { id: 'u3', name: '李明' },
}

export default function Login() {
  const navigate = useNavigate()
  const login = useUserStore((s) => s.login)

  const handleSelect = (role: UserRole) => {
    const user = PREDEFINED_USERS[role]
    login({ id: user.id, name: user.name, role })
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          口腔耗材 · 临期预警与换货处理
        </h1>
        <p className="text-slate-400 mb-10">选择角色进入系统</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {ROLE_CONFIG.map(({ role, icon: Icon, borderHover, iconColor }) => (
            <button
              key={role}
              onClick={() => handleSelect(role)}
              className={`flex-1 rounded-xl border border-slate-700 bg-slate-800/60 p-6 cursor-pointer
                transition-all duration-200 hover:scale-105 ${borderHover}
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0f172a]`}
            >
              <Icon className={`mx-auto mb-3 h-10 w-10 ${iconColor}`} />
              <div className="text-white font-semibold text-lg mb-1">
                {ROLE_LABELS[role]}
              </div>
              <div className="text-slate-400 text-sm">
                {ROLE_DESCRIPTIONS[role]}
              </div>
            </button>
          ))}
        </div>

        <p className="mt-10 text-xs text-slate-500">轻账号体系 · 非真实认证</p>
      </div>
    </div>
  )
}
