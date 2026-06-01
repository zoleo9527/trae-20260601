import { useStore } from '@/store';
import type { CareRecord } from '@/types';
import { AlertTriangle, Bandage, Check, CheckCircle2, CircleDot, Clock, Droplets, Eye, Pill, Thermometer, User, UtensilsCrossed } from 'lucide-react';

const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  medication: { icon: <Pill size={14} />, color: 'text-blue-600', bg: 'bg-blue-50', label: '用药' },
  dressing: { icon: <Bandage size={14} />, color: 'text-orange-600', bg: 'bg-orange-50', label: '换药' },
  feeding: { icon: <UtensilsCrossed size={14} />, color: 'text-green-600', bg: 'bg-green-50', label: '喂食' },
  iv_fluid: { icon: <Droplets size={14} />, color: 'text-cyan-600', bg: 'bg-cyan-50', label: '输液' },
  observation: { icon: <Eye size={14} />, color: 'text-purple-600', bg: 'bg-purple-50', label: '观察' },
  vitals: { icon: <Thermometer size={14} />, color: 'text-rose-600', bg: 'bg-rose-50', label: '体征' },
  other: { icon: <CircleDot size={14} />, color: 'text-slate-600', bg: 'bg-slate-50', label: '其他' },
}

function ExecutionInfo({ task }: { task: CareRecord }) {
  return (
    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
      {task.executed_by && (
        <span className="inline-flex items-center gap-0.5">
          <User size={10} />
          {task.executed_by}
        </span>
      )}
      {task.executed_at && (
        <span className="font-mono">{task.executed_at}</span>
      )}
    </div>
  )
}

export default function TaskList({ tasks, onToggle }: { tasks: CareRecord[]; onToggle: (task: CareRecord) => void }) {
  const { role } = useStore()

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
          <Check size={24} className="text-emerald-500" />
        </div>
        <p className="text-slate-500 font-medium">今日任务已全部完成</p>
        <p className="text-sm text-slate-400 mt-1">没有待执行的护理任务</p>
      </div>
    )
  }

  const abnormal = tasks.filter((t) => t.status === 'missed' || t.status === 'delayed' || t.is_abnormal)
  const abnormalIds = new Set(abnormal.map((t) => t.id))
  const pending = tasks.filter((t) => t.status === 'pending' && !abnormalIds.has(t.id))
  const completed = tasks.filter((t) => t.status === 'completed' && !abnormalIds.has(t.id))

  return (
    <div className="space-y-6">
      {abnormal.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-1.5">
            <AlertTriangle size={14} />
            异常/待处理 ({abnormal.length})
          </h3>
          <div className="space-y-2">
            {abnormal.map((task) => {
              const tc = typeConfig[task.type] || typeConfig.other
              const isHandled = task.status === 'completed' || task.status === 'delayed'
              return (
                <div key={task.id} className={`flex items-center gap-3 rounded-lg p-3 ${isHandled ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className={`w-8 h-8 rounded-lg ${tc.bg} ${tc.color} flex items-center justify-center shrink-0`}>
                    {tc.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-slate-800 truncate">{task.content}</p>
                      {isHandled && (
                        <span className="inline-flex items-center gap-0.5 shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={10} />
                          已处理
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                      <span className="font-mono">{task.scheduled_at}</span>
                      <span>·</span>
                      <span className="font-medium text-slate-700">{task.patient_name}</span>
                      <span className="font-mono bg-slate-100 px-1 rounded">{task.cage_number}</span>
                    </div>
                    {task.abnormal_note && (
                      <p className="text-xs text-red-600 mt-1">⚠ {task.abnormal_note}</p>
                    )}
                    {isHandled && <ExecutionInfo task={task} />}
                  </div>
                  {task.status === 'missed' && role === 'nurse' && (
                    <button
                      onClick={() => onToggle(task)}
                      className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shrink-0"
                    >
                      补执行
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
            <Clock size={14} className="text-vet-sky" />
            待执行 ({pending.length})
          </h3>
          <div className="space-y-2">
            {pending.map((task) => {
              const tc = typeConfig[task.type] || typeConfig.other
              return (
                <div key={task.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                  <div className={`w-8 h-8 rounded-lg ${tc.bg} ${tc.color} flex items-center justify-center shrink-0`}>
                    {tc.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{task.content}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                      <span className="font-mono">{task.scheduled_at}</span>
                      <span>·</span>
                      <span className="font-medium text-slate-700">{task.patient_name}</span>
                      <span className="font-mono bg-slate-100 px-1 rounded">{task.cage_number}</span>
                    </div>
                  </div>
                  {role === 'nurse' && (
                    <button
                      onClick={() => onToggle(task)}
                      className="px-3 py-1.5 text-xs font-medium bg-vet-sky text-white rounded-lg hover:bg-vet-sky-dark transition-colors shrink-0"
                    >
                      完成
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-500 mb-3 flex items-center gap-1.5">
            <Check size={14} className="text-emerald-500" />
            已完成 ({completed.length})
          </h3>
          <div className="space-y-2">
            {completed.map((task) => {
              const tc = typeConfig[task.type] || typeConfig.other
              return (
                <div key={task.id} className="flex items-center gap-3 bg-white border border-slate-100 rounded-lg p-3">
                  <div className={`w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center shrink-0`}>
                    <Check size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-600 truncate">{task.content}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                      <span className="font-mono">{task.scheduled_at}</span>
                      <span>·</span>
                      <span>{task.patient_name}</span>
                      <span className="font-mono bg-slate-50 px-1 rounded">{task.cage_number}</span>
                    </div>
                    <ExecutionInfo task={task} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
