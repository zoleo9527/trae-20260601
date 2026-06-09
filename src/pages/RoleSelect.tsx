import { useNavigate } from 'react-router-dom'
import { Stethoscope, Heart, Shield, ArrowRight, Activity } from 'lucide-react'
import type { Role } from '@/types'
import { ROLE_LABELS } from '@/types'
import { useRoleStore } from '@/store/useRoleStore'

const roleConfig: { role: Role; icon: typeof Stethoscope; desc: string; color: string; bg: string }[] = [
  {
    role: 'doctor',
    icon: Stethoscope,
    desc: '随访处置 · 预警确认 · 异常裁定 · 批量审核',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
  },
  {
    role: 'nurse',
    icon: Heart,
    desc: '随访执行 · 指标录入 · 异常上报 · 批量标记',
    color: 'text-blue-600',
    bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
  },
  {
    role: 'ph_specialist',
    icon: Shield,
    desc: '预警监控 · 趋势分析 · 异常分发 · 批量派单',
    color: 'text-amber-600',
    bg: 'bg-amber-50 hover:bg-amber-100 border-amber-200',
  },
]

export default function RoleSelect() {
  const navigate = useNavigate()
  const setRole = useRoleStore((s) => s.setRole)

  const handleSelect = (role: Role) => {
    setRole(role)
    navigate('/followup')
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            慢病随访与指标预警
          </h1>
        </div>
        <p className="text-slate-400 text-lg">
          社区卫生站 · 选择角色进入工作台
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
        {roleConfig.map(({ role, icon: Icon, desc, color, bg }) => (
          <button
            key={role}
            onClick={() => handleSelect(role)}
            className={`${bg} border-2 rounded-2xl p-8 text-left transition-all duration-200 group cursor-pointer`}
          >
            <div className={`${color} mb-4`}>
              <Icon className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              {ROLE_LABELS[role]}
            </h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">{desc}</p>
            <div className="flex items-center gap-1 text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
              进入工作台
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        ))}
      </div>

      <div className="mt-16 text-center">
        <p className="text-slate-500 text-sm">
          不同角色看到的信息不同，但状态口径一致
        </p>
        <p className="text-slate-600 text-xs mt-2">
          随访→预警之间无空档 · 异常样例可直接触发提醒或退回
        </p>
      </div>
    </div>
  )
}
