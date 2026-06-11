import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserCog, Shield, Award, User, ChevronDown, ChevronRight, RotateCcw } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import { useDataStore } from '@/store/dataStore'

const ROLE_CONFIG: Record<string, { label: string; icon: any; accent: string; iconColor: string }> = {
  counter_manager: { label: '柜长', icon: UserCog, accent: 'border-blue-500 shadow-blue-500/20 hover:shadow-blue-500/40', iconColor: 'text-blue-400' },
  floor_supervisor: { label: '楼层主管', icon: Shield, accent: 'border-amber-500 shadow-amber-500/20 hover:shadow-amber-500/40', iconColor: 'text-amber-400' },
  brand_supervisor: { label: '品牌督导', icon: Award, accent: 'border-emerald-500 shadow-emerald-500/20 hover:shadow-emerald-500/40', iconColor: 'text-emerald-400' },
  guide: { label: '导购', icon: User, accent: 'border-purple-500 shadow-purple-500/20 hover:shadow-purple-500/40', iconColor: 'text-purple-400' },
}

export default function Login() {
  const { login, loadAccounts, accounts } = useAuthStore()
  const { resetData } = useDataStore()
  const navigate = useNavigate()
  const [expandedRole, setExpandedRole] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  const roles = ['counter_manager', 'floor_supervisor', 'brand_supervisor', 'guide']

  const accountsByRole = roles.reduce<Record<string, any[]>>((acc, r) => {
    acc[r] = accounts.filter((a: any) => a.role === r)
    return acc
  }, {})

  const handleLogin = async (role: string, staffId?: number) => {
    await login(role, staffId)
    if (role === 'counter_manager') {
      navigate('/schedule')
    } else {
      navigate('/attendance')
    }
  }

  const handleReset = async () => {
    setResetting(true)
    try {
      await resetData()
    } finally {
      setTimeout(() => setResetting(false), 800)
    }
  }

  return (
    <div className="min-h-screen bg-ops-dark flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-100 mb-2">百货专柜排班与考勤确认系统</h1>
          <p className="text-sm text-gray-500">选择角色以演示登录（支持不同专柜/品牌人员切换）</p>
          <button
            onClick={handleReset}
            className={cn(
              'mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs',
              'bg-ops-card border border-ops-border text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-all',
              resetting && 'animate-spin text-emerald-400 border-emerald-500/50'
            )}
          >
            <RotateCcw size={14} className={cn(resetting && 'animate-spin')} />
            {resetting ? '重置中...' : '重置演示数据'}
          </button>
        </div>

        <div className="space-y-3">
          {roles.map((role, rIdx) => {
            const cfg = ROLE_CONFIG[role]
            const list = accountsByRole[role] || []
            const Icon = cfg.icon
            const isExpanded = expandedRole === role
            const hasMultiple = list.length > 1

            return (
              <div
                key={role}
                className={cn(
                  'rounded-xl border-2 bg-ops-card transition-all duration-300',
                  cfg.accent,
                  isExpanded && 'shadow-lg'
                )}
                style={{ animation: `fadeSlideIn 0.4s ease-out ${rIdx * 80}ms both` }}
              >
                <div
                  className="flex items-center justify-between p-5 cursor-pointer"
                  onClick={() => hasMultiple ? setExpandedRole(isExpanded ? null : role) : handleLogin(role, list[0]?.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn('w-12 h-12 rounded-lg bg-ops-dark flex items-center justify-center', cfg.iconColor)}>
                      <Icon size={24} />
                    </div>
                    <div className="text-left">
                      <p className="text-base font-semibold text-gray-100">{cfg.label}</p>
                      <p className="text-xs text-gray-500">
                        {list.length === 0 ? '加载中...' : hasMultiple ? `${list.length} 个账号可选` : `演示账户：${list[0]?.name || '-'}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    {!hasMultiple && <span className="text-xs bg-ops-dark px-2 py-1 rounded">点击登录</span>}
                    {hasMultiple && (isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />)}
                  </div>
                </div>

                {hasMultiple && isExpanded && (
                  <div className="border-t border-gray-700/50 px-4 py-3 bg-black/20 rounded-b-xl">
                    <p className="text-xs text-gray-500 mb-2 px-1">选择具体人员登录：</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {list.map((a: any) => (
                        <button
                          key={a.id}
                          onClick={() => handleLogin(role, a.id)}
                          className={cn(
                            'flex items-center justify-between p-3 rounded-lg',
                            'bg-ops-dark/80 hover:bg-ops-dark border border-transparent hover:border-gray-600/50 transition-all text-left group'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-xs font-semibold text-white">
                              {a.avatar || a.name?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-200 group-hover:text-white">{a.name}</p>
                              <p className="text-xs text-gray-500">{a.counterName || '全楼层'}</p>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-gray-600 group-hover:text-gray-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
