import { useNavigate } from 'react-router-dom'
import { UserCog, Shield, Award, User } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const ROLES = [
  { role: 'counter_manager', label: '柜长', name: '王芳', icon: UserCog, accent: 'border-blue-500 shadow-blue-500/20 hover:shadow-blue-500/40', iconColor: 'text-blue-400' },
  { role: 'floor_supervisor', label: '楼层主管', name: '张明', icon: Shield, accent: 'border-amber-500 shadow-amber-500/20 hover:shadow-amber-500/40', iconColor: 'text-amber-400' },
  { role: 'brand_supervisor', label: '品牌督导', name: '李红', icon: Award, accent: 'border-emerald-500 shadow-emerald-500/20 hover:shadow-emerald-500/40', iconColor: 'text-emerald-400' },
  { role: 'guide', label: '导购', name: '陈丽', icon: User, accent: 'border-purple-500 shadow-purple-500/20 hover:shadow-purple-500/40', iconColor: 'text-purple-400' },
]

export default function Login() {
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleLogin = async (role: string) => {
    await login(role)
    if (role === 'counter_manager') {
      navigate('/schedule')
    } else {
      navigate('/attendance')
    }
  }

  return (
    <div className="min-h-screen bg-ops-dark flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-gray-100 mb-2">百货专柜排班与考勤确认系统</h1>
          <p className="text-sm text-gray-500">选择角色以演示登录</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {ROLES.map((item, idx) => {
            const Icon = item.icon
            return (
              <button
                key={item.role}
                onClick={() => handleLogin(item.role)}
                className={`group relative rounded-xl border-2 ${item.accent} bg-ops-card p-6 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5`}
                style={{ animationDelay: `${idx * 100}ms`, animation: 'fadeSlideIn 0.5s ease-out both' }}
              >
                <div className="flex justify-center mb-4">
                  <div className={`w-12 h-12 rounded-lg bg-ops-dark flex items-center justify-center ${item.iconColor}`}>
                    <Icon size={24} />
                  </div>
                </div>
                <p className="text-base font-semibold text-gray-100 mb-1">{item.label}</p>
                <p className="text-xs text-gray-500">演示账户: {item.name}</p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
