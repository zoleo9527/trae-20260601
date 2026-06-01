import { useStore } from '@/store';
import type { Followup } from '@/types';
import { AlertTriangle, CalendarCheck, CheckCircle, Clock, MessageSquare, Phone, RefreshCw, User } from 'lucide-react';

const statusConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string; label: string }> = {
  overdue: { icon: <AlertTriangle size={14} />, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', label: '已逾期' },
  pending: { icon: <Clock size={14} />, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', label: '待预约' },
  confirmed: { icon: <CalendarCheck size={14} />, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', label: '已预约' },
  completed: { icon: <CheckCircle size={14} />, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', label: '已完成' },
  rescheduled: { icon: <RefreshCw size={14} />, color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200', label: '已改期' },
}

export default function FollowupList({ followups, onConfirm, onReschedule }: {
  followups: Followup[]
  onConfirm: (id: number) => void
  onReschedule: (id: number) => void
}) {
  const { role } = useStore()

  const grouped = {
    overdue: followups.filter((f) => f.status === 'overdue'),
    pending: followups.filter((f) => f.status === 'pending'),
    other: followups.filter((f) => f.status !== 'overdue' && f.status !== 'pending'),
  }

  return (
    <div className="space-y-8">
      {grouped.overdue.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-1.5">
            <AlertTriangle size={14} />
            已逾期 ({grouped.overdue.length})
          </h3>
          <div className="space-y-2.5">
            {grouped.overdue.map((f) => {
              const sc = statusConfig[f.status]
              return (
                <div key={f.id} className={`rounded-xl border-2 ${sc.border} ${sc.bg} p-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${sc.bg} ${sc.color} border ${sc.border}`}>
                        {sc.icon}
                        {sc.label}
                      </span>
                      <span className="font-mono text-sm text-red-600 font-semibold">{f.scheduled_date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{f.species === '兔' ? '🐰' : f.species === '猫' ? '🐱' : '🐶'}</span>
                    <span className="font-semibold text-slate-800">{f.patient_name}</span>
                    <span className="text-sm text-slate-500">{f.breed}</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{f.reason}</p>
                  <div className="flex items-center gap-3 text-sm text-slate-500 mb-3">
                    <span className="flex items-center gap-1"><User size={12} />{f.owner_name}</span>
                    <span className="flex items-center gap-1"><Phone size={12} />{f.owner_phone}</span>
                  </div>
                  {f.notes && (
                    <p className="text-xs text-slate-500 bg-white/60 px-2.5 py-1.5 rounded mb-3">{f.notes}</p>
                  )}
                  {role === 'receptionist' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => onConfirm(f.id)}
                        className="px-3 py-1.5 text-xs font-medium bg-vet-violet text-white rounded-lg hover:bg-vet-violet-dark transition-colors"
                      >
                        确认预约
                      </button>
                      <button
                        onClick={() => onReschedule(f.id)}
                        className="px-3 py-1.5 text-xs font-medium bg-white text-vet-violet border border-violet-200 rounded-lg hover:bg-violet-50 transition-colors"
                      >
                        改期
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {grouped.pending.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-1.5">
            <Clock size={14} />
            待预约 ({grouped.pending.length})
          </h3>
          <div className="space-y-2.5">
            {grouped.pending.map((f) => {
              const sc = statusConfig[f.status]
              return (
                <div key={f.id} className={`rounded-xl border ${sc.border} ${sc.bg} p-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${sc.bg} ${sc.color} border ${sc.border}`}>
                      {sc.icon}
                      {sc.label}
                    </span>
                    <span className="font-mono text-sm text-slate-600">{f.scheduled_date}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{f.species === '兔' ? '🐰' : f.species === '猫' ? '🐱' : '🐶'}</span>
                    <span className="font-semibold text-slate-800">{f.patient_name}</span>
                    <span className="text-sm text-slate-500">{f.breed}</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{f.reason}</p>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><User size={12} />{f.owner_name}</span>
                    <span className="flex items-center gap-1"><Phone size={12} />{f.owner_phone}</span>
                  </div>
                  {role === 'receptionist' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => onConfirm(f.id)}
                        className="px-3 py-1.5 text-xs font-medium bg-vet-violet text-white rounded-lg hover:bg-vet-violet-dark transition-colors"
                      >
                        确认预约
                      </button>
                      <button
                        onClick={() => onReschedule(f.id)}
                        className="px-3 py-1.5 text-xs font-medium bg-white text-vet-violet border border-violet-200 rounded-lg hover:bg-violet-50 transition-colors"
                      >
                        改期
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {grouped.other.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-slate-500 mb-3 flex items-center gap-1.5">
            <MessageSquare size={14} />
            其他 ({grouped.other.length})
          </h3>
          <div className="space-y-2.5">
            {grouped.other.map((f) => {
              const sc = statusConfig[f.status] || statusConfig.completed
              return (
                <div key={f.id} className={`rounded-xl border ${sc.border} ${sc.bg} p-4 opacity-70`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${sc.bg} ${sc.color} border ${sc.border}`}>
                      {sc.icon}
                      {sc.label}
                    </span>
                    <span className="font-mono text-sm text-slate-500">{f.scheduled_date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{f.patient_name}</span>
                    <span className="text-sm text-slate-500">{f.reason}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
