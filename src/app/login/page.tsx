'use client'

import { useAuthStore } from '@/lib/auth-store'
import { useRouter } from 'next/navigation'
import { UserRole, ROLE_LABELS } from '@/lib/types'
import { Stethoscope, ClipboardList, ShieldCheck } from 'lucide-react'
import { useEffect } from 'react'

const roleCards: { role: UserRole; icon: React.ReactNode; desc: string; color: string }[] = [
  {
    role: 'THERAPIST',
    icon: <Stethoscope size={36} />,
    desc: '查看排班、执行治疗、标记状态',
    color: 'from-blue-500 to-cyan-400',
  },
  {
    role: 'RECEPTION',
    icon: <ClipboardList size={36} />,
    desc: '签到办理、消课确认、催促退回补材料',
    color: 'from-accent-400 to-amber-400',
  },
  {
    role: 'DIRECTOR',
    icon: <ShieldCheck size={36} />,
    desc: '预警总览、全局排班、审批协调',
    color: 'from-navy-500 to-navy-300',
  },
]

const roleUserMap: Record<UserRole, { userId: string; userName: string }> = {
  THERAPIST: { userId: 'u1', userName: '张康复' },
  RECEPTION: { userId: 'u3', userName: '王前台' },
  DIRECTOR: { userId: 'u4', userName: '赵主任' },
}

const roleRedirect: Record<UserRole, string> = {
  THERAPIST: '/therapist/schedule',
  RECEPTION: '/reception/checkin',
  DIRECTOR: '/director/overview',
}

export default function LoginPage() {
  const { login, userRole } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (userRole) {
      router.push(roleRedirect[userRole])
    }
  }, [userRole, router])

  const handleLogin = (role: UserRole) => {
    const { userId, userName } = roleUserMap[role]
    login(userId, userName, role)
    router.push(roleRedirect[role])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-500 via-navy-400 to-navy-600 flex items-center justify-center p-8">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white tracking-wide">康复治疗中心</h1>
          <p className="text-navy-100 mt-3 text-lg">治疗排班与签到消课管理系统</p>
          <div className="w-20 h-1 bg-accent-400 mx-auto mt-4 rounded-full" />
        </div>

        <div className="grid grid-cols-3 gap-6">
          {roleCards.map((card) => (
            <button
              key={card.role}
              onClick={() => handleLogin(card.role)}
              className="group bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center hover:bg-white/20 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border border-white/10"
            >
              <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                {card.icon}
              </div>
              <h2 className="text-white text-lg font-bold mb-2">{ROLE_LABELS[card.role]}</h2>
              <p className="text-navy-100 text-sm leading-relaxed">{card.desc}</p>
            </button>
          ))}
        </div>

        <p className="text-center text-navy-200 text-xs mt-10">
          选择角色即可快速进入系统 · 简化登录模式
        </p>
      </div>
    </div>
  )
}
