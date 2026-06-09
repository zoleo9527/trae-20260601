import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { Scale, Warehouse, Headphones, Anchor } from 'lucide-react'
import { useState } from 'react'

const ROLES = [
  {
    key: 'gate' as const,
    label: '闸口员',
    desc: '集装箱进出场登记、闸口记录查看、异常标记',
    icon: Scale,
    username: 'gate01',
    password: 'gate01',
    redirect: '/gate',
  },
  {
    key: 'dispatch' as const,
    label: '堆场调度',
    desc: '堆位分配、移箱任务执行、海关查验协调',
    icon: Warehouse,
    username: 'dispatch01',
    password: 'dispatch01',
    redirect: '/dispatch',
  },
  {
    key: 'service' as const,
    label: '客户服务',
    desc: '查验通知确认、费用争议处理、补录/改期/驳回操作',
    icon: Headphones,
    username: 'service01',
    password: 'service01',
    redirect: '/service',
  },
]

export default function Login() {
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const [loading, setLoading] = useState<string | null>(null)

  const handleLogin = async (role: typeof ROLES[number]) => {
    setLoading(role.key)
    try {
      await login(role.username, role.password)
      navigate(role.redirect)
    } catch (err) {
      alert('登录失败: ' + (err instanceof Error ? err.message : '未知错误'))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-portNavy flex flex-col items-center justify-center px-4">
      <div className="flex items-center gap-3 mb-3">
        <Anchor size={36} className="text-portOrange" />
        <h1 className="text-3xl font-bold text-white">港口堆场</h1>
      </div>
      <p className="text-white/60 mb-10 text-sm">海关查验与移箱任务管理系统</p>

      <div className="flex gap-6 flex-wrap justify-center">
        {ROLES.map((role) => {
          const Icon = role.icon
          return (
            <div
              key={role.key}
              className="w-64 bg-white/5 border border-white/10 rounded-lg p-6 flex flex-col items-center hover:border-portOrange hover:bg-white/10 transition-all duration-200 hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-full bg-portBlue/20 flex items-center justify-center mb-4">
                <Icon size={28} className="text-portBlue" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{role.label}</h3>
              <p className="text-white/50 text-sm text-center mb-5 leading-relaxed">
                {role.desc}
              </p>
              <button
                onClick={() => handleLogin(role)}
                disabled={loading !== null}
                className="w-full py-2.5 bg-portOrange text-white rounded-lg font-medium hover:bg-portOrange/90 transition-colors disabled:opacity-50"
              >
                {loading === role.key ? '登录中...' : '登录'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
