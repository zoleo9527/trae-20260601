import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { Car, ClipboardCheck, ShieldCheck } from 'lucide-react'
import type { RoleType } from '@/types'

const ROLES: { key: RoleType; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
  {
    key: 'receptionist',
    label: '接车员',
    desc: '处理预约接车、填写接车备注、补充退回记录',
    icon: <Car className="w-10 h-10" />,
    color: 'from-sky-500 to-sky-700',
  },
  {
    key: 'inspector',
    label: '检测员',
    desc: '执行车辆检测、填写检测结果、处理复检',
    icon: <ClipboardCheck className="w-10 h-10" />,
    color: 'from-violet-500 to-violet-700',
  },
  {
    key: 'reviewer',
    label: '审核员',
    desc: '资料核验、审核通过或退回、批量审核',
    icon: <ShieldCheck className="w-10 h-10" />,
    color: 'from-amber-500 to-amber-700',
  },
]

export default function Login() {
  const setCurrentRole = useStore((s) => s.setCurrentRole)
  const navigate = useNavigate()

  const handleLogin = (role: RoleType) => {
    setCurrentRole(role)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10 w-full max-w-4xl px-6">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Car className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              车辆年检站
            </h1>
          </div>
          <p className="text-slate-400 text-lg">预约接车与资料核验系统</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {ROLES.map((r) => (
            <button
              key={r.key}
              onClick={() => handleLogin(r.key)}
              className="group relative bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-left transition-all duration-300 hover:-translate-y-2 hover:border-slate-600 hover:shadow-2xl hover:shadow-black/30"
            >
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center text-white mb-6 transition-transform duration-300 group-hover:scale-110`}>
                {r.icon}
              </div>
              <h2 className="text-xl font-bold text-white mb-2">{r.label}</h2>
              <p className="text-sm text-slate-400 leading-relaxed">{r.desc}</p>
              <div className="absolute bottom-4 right-4 text-slate-600 group-hover:text-slate-400 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </button>
          ))}
        </div>

        <div className="text-center mt-10 text-slate-600 text-xs">
          点击角色卡片即可进入对应工作台
        </div>
      </div>
    </div>
  )
}
