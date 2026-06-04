import { useAppStore } from '@/store'
import type { Role } from '@/types'
import { HeartPulse, Shield, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const ROLE_CARDS: {
  role: Role
  icon: React.ReactNode
  name: string
  description: string
  route: string
}[] = [
  {
    role: 'supervisor',
    icon: <Shield className="w-12 h-12 text-primary-600" />,
    name: '护理主管',
    description: '查看服药统计、审批异常上报、管理护理质量',
    route: '/supervisor',
  },
  {
    role: 'caregiver',
    icon: <HeartPulse className="w-12 h-12 text-primary-600" />,
    name: '责任护工',
    description: '查看服药提醒、确认服药状态、上报异常情况',
    route: '/caregiver',
  },
  {
    role: 'social_worker',
    icon: <Users className="w-12 h-12 text-primary-600" />,
    name: '社工',
    description: '处理家属沟通、确认通知状态、协调各方资源',
    route: '/social-worker',
  },
]

export default function RoleSelect() {
  const setRole = useAppStore((s) => s.setRole)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
          养老护理院服药提醒系统
        </h1>
        <p className="text-center text-gray-500 mb-10">请选择您的角色进入系统</p>
        <div className="grid grid-cols-3 gap-6">
          {ROLE_CARDS.map((card) => (
            <button
              key={card.role}
              onClick={() => {
                setRole(card.role)
                navigate(card.route)
              }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col items-center gap-4 hover:shadow-lg hover:-translate-y-1 hover:border-primary-400 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary-50">
                {card.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{card.name}</h3>
              <p className="text-sm text-gray-500 text-center leading-relaxed">{card.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
