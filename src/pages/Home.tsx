import PatientCard from '@/components/PatientCard'
import RoleSwitcher from '@/components/RoleSwitcher'
import { useStore } from '@/store'
import type { Patient } from '@/types'
import { Activity, CalendarCheck, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'

const roleHeaderConfig = {
  doctor: { icon: <Activity size={20} />, title: '住院总览', subtitle: '查看病情变化与医嘱管理', color: 'text-vet-teal' },
  nurse: { icon: <Clock size={20} />, title: '住院总览', subtitle: '查看今日护理任务与异常', color: 'text-vet-sky' },
  receptionist: { icon: <CalendarCheck size={20} />, title: '住院总览', subtitle: '查看复诊安排与客户沟通', color: 'text-vet-violet' },
}

export default function Home() {
  const { role, patients, fetchPatients } = useStore()
  const [filter, setFilter] = useState<'all' | 'hospitalized' | 'discharged'>('hospitalized')

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const config = roleHeaderConfig[role]
  const filtered = filter === 'all' ? patients : patients.filter((p) => p.status === filter)
  const hospitalized = patients.filter((p) => p.status === 'hospitalized')
  const abnormalCount = hospitalized.reduce((sum, p) => sum + (p.abnormal_count ?? 0), 0)
  const pendingFollowups = patients.reduce((sum, p) => sum + (p.pending_followups ?? 0), 0)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className={config.color}>{config.icon}</span>
            {config.title}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{config.subtitle}</p>
        </div>
        <RoleSwitcher />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">当前住院</div>
          <div className="text-2xl font-bold text-slate-800">{hospitalized.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">异常记录</div>
          <div className={`text-2xl font-bold ${abnormalCount > 0 ? 'text-red-500' : 'text-slate-800'}`}>{abnormalCount}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">待约复诊</div>
          <div className={`text-2xl font-bold ${pendingFollowups > 0 ? 'text-vet-violet' : 'text-slate-800'}`}>{pendingFollowups}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {(['hospitalized', 'all', 'discharged'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
              filter === f
                ? 'bg-slate-800 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f === 'hospitalized' ? '住院中' : f === 'discharged' ? '已出院' : '全部'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((patient: Patient) => (
          <PatientCard key={patient.id} patient={patient} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <p>暂无{filter === 'hospitalized' ? '住院中' : filter === 'discharged' ? '已出院' : ''}宠物</p>
        </div>
      )}
    </div>
  )
}
