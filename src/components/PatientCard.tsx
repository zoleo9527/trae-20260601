import { useStore } from '@/store'
import type { Patient } from '@/types'
import { AlertTriangle, Clock, Minus, Phone, TrendingDown, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const trendIcons = {
  improving: <TrendingUp size={14} className="text-emerald-500" />,
  stable: <Minus size={14} className="text-slate-400" />,
  worsening: <TrendingDown size={14} className="text-red-500" />,
}

const trendLabels = {
  improving: '好转',
  stable: '稳定',
  worsening: '加重',
}

const trendColors = {
  improving: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  stable: 'bg-slate-50 text-slate-600 border-slate-200',
  worsening: 'bg-red-50 text-red-700 border-red-200',
}

export default function PatientCard({ patient }: { patient: Patient }) {
  const { role } = useStore()
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/patient/${patient.id}`)}
      className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-lg">
            {patient.species === '猫' ? '🐱' : patient.species === '狗' ? '🐶' : patient.species === '兔' ? '🐰' : '🐾'}
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 group-hover:text-vet-teal transition-colors">{patient.name}</h3>
            <p className="text-xs text-slate-400">{patient.breed} · {patient.age}</p>
          </div>
        </div>
        <span className="text-xs font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
          {patient.cage_number}
        </span>
      </div>

      {role === 'doctor' && (
        <>
          <div className="mb-2">
            <span className="text-xs text-slate-500">诊断</span>
            <p className="text-sm font-medium text-slate-700">{patient.diagnosis}</p>
          </div>
          <div className="flex items-center gap-2">
            {patient.condition_trend && (
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${trendColors[patient.condition_trend]}`}>
                {trendIcons[patient.condition_trend]}
                {trendLabels[patient.condition_trend]}
              </span>
            )}
            {(patient.abnormal_count ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-vet-amber-light text-amber-700 border border-amber-200">
                <AlertTriangle size={12} />
                {patient.abnormal_count}项异常
              </span>
            )}
          </div>
        </>
      )}

      {role === 'nurse' && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            <Clock size={14} className="text-vet-sky" />
            <span className="text-slate-600">{patient.pending_tasks ?? 0}项待办</span>
          </div>
          {(patient.abnormal_count ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-vet-amber-light text-amber-700 border border-amber-200">
              <AlertTriangle size={12} />
              异常
            </span>
          )}
        </div>
      )}

      {role === 'receptionist' && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <span className="text-slate-400 text-xs">主人</span>
            <span>{patient.owner_name}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Phone size={12} />
            <span className="font-mono text-xs">{patient.owner_phone}</span>
          </div>
          {(patient.pending_followups ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-vet-violet-light text-vet-violet-dark border border-violet-200">
              待约复诊
            </span>
          )}
        </div>
      )}
    </div>
  )
}
