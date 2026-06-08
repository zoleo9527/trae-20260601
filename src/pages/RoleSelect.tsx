import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, ClipboardCheck, Wrench, ChevronRight } from 'lucide-react'
import { useAppStore } from '@/store/index'
import type { UserRole } from '@/types'

interface RoleCard {
  role: UserRole
  icon: React.ReactNode
  title: string
  description: string
  color: string
  bgColor: string
  borderColor: string
}

const roles: RoleCard[] = [
  {
    role: 'supervisor',
    icon: <ShieldCheck size={40} className="text-[#1E3A5F]" />,
    title: '客房主管',
    description: '查看全局房态板、分配查房任务、审核迷你吧异常',
    color: '#1E3A5F',
    bgColor: 'bg-[#1E3A5F]/5',
    borderColor: 'border-t-[#1E3A5F]',
  },
  {
    role: 'attendant',
    icon: <ClipboardCheck size={40} className="text-[#D4A853]" />,
    title: '保洁员',
    description: '接收查房任务、执行退房查房、迷你吧核对',
    color: '#D4A853',
    bgColor: 'bg-[#D4A853]/5',
    borderColor: 'border-t-[#D4A853]',
  },
  {
    role: 'engineer',
    icon: <Wrench size={40} className="text-gray-500" />,
    title: '工程师',
    description: '接收维修工单、更新维修状态',
    color: '#6B7280',
    bgColor: 'bg-gray-500/5',
    borderColor: 'border-t-[#6B7280]',
  },
]

export default function RoleSelect() {
  const navigate = useNavigate()
  const { users, setCurrentUser, currentRole } = useAppStore()
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)

  useEffect(() => {
    if (currentRole && !selectedRole) {
      const roleUsers = users.filter((u) => u.role === currentRole)
      if (roleUsers.length === 1) {
        setSelectedRole(currentRole)
        const user = roleUsers[0]
        setCurrentUser(user.id, currentRole)
        navigate(`/${currentRole}`)
      }
    }
  }, [currentRole, users, navigate, selectedRole, setCurrentUser])

  const roleUsers = selectedRole
    ? users.filter((u) => u.role === selectedRole)
    : []

  const handleRoleSelect = (role: UserRole) => {
    const roleUsersForRole = users.filter((u) => u.role === role)
    if (roleUsersForRole.length === 1) {
      const user = roleUsersForRole[0]
      setCurrentUser(user.id, role)
      navigate(`/${role}`)
      return
    }
    setSelectedRole(role)
  }

  const handleUserSelect = (userId: string) => {
    if (!selectedRole) return
    setCurrentUser(userId, selectedRole)
    navigate(`/${selectedRole}`)
  }

  const handleBack = () => {
    setSelectedRole(null)
  }

  const currentRoleCard = roles.find((r) => r.role === selectedRole)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4">
      <h1 className="mb-3 font-serif text-3xl font-bold text-[#1E3A5F]">
        酒店客房管理系统
      </h1>
      <p className="mb-10 text-gray-500">
        {selectedRole ? `请选择${currentRoleCard?.title ?? ''}身份` : '请选择您的角色进入系统'}
      </p>

      {selectedRole ? (
        <div className="w-full max-w-md">
          <button
            onClick={handleBack}
            className="mb-4 flex items-center gap-1 text-sm text-[#1E3A5F] hover:underline"
          >
            ← 返回角色选择
          </button>
          <div className="space-y-3">
            {roleUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => handleUserSelect(user.id)}
                className={`flex cursor-pointer items-center justify-between rounded-xl border-t-4 ${currentRoleCard?.borderColor ?? ''} bg-white p-5 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${currentRoleCard?.bgColor ?? ''}`}>
                    <span className="text-lg font-bold" style={{ color: currentRoleCard?.color }}>
                      {user.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">{user.name}</h3>
                    <p className="text-xs text-gray-400">
                      {currentRoleCard?.title}
                    </p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-300" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex w-full max-w-4xl gap-6">
          {roles.map((card) => (
            <div
              key={card.role}
              onClick={() => handleRoleSelect(card.role)}
              className={`flex flex-1 cursor-pointer flex-col items-center rounded-xl border-t-4 ${card.borderColor} bg-white p-8 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl`}
            >
              <div className="mb-4">{card.icon}</div>
              <h2
                className="mb-2 text-xl font-semibold"
                style={{ color: card.color }}
              >
                {card.title}
              </h2>
              <p className="text-center text-sm text-gray-500">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
