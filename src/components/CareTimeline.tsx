import type { CareRecord } from '@/types';
import { AlertTriangle, Bandage, Check, CircleDot, Clock, Droplets, Eye, Pill, Thermometer, UtensilsCrossed, X } from 'lucide-react';

const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  medication: { icon: <Pill size={14} />, color: 'text-blue-600', bg: 'bg-blue-50', label: '用药' },
  dressing: { icon: <Bandage size={14} />, color: 'text-orange-600', bg: 'bg-orange-50', label: '换药' },
  feeding: { icon: <UtensilsCrossed size={14} />, color: 'text-green-600', bg: 'bg-green-50', label: '喂食' },
  iv_fluid: { icon: <Droplets size={14} />, color: 'text-cyan-600', bg: 'bg-cyan-50', label: '输液' },
  observation: { icon: <Eye size={14} />, color: 'text-purple-600', bg: 'bg-purple-50', label: '观察' },
  vitals: { icon: <Thermometer size={14} />, color: 'text-rose-600', bg: 'bg-rose-50', label: '体征' },
  other: { icon: <CircleDot size={14} />, color: 'text-slate-600', bg: 'bg-slate-50', label: '其他' },
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  completed: { icon: <Check size={12} />, color: 'text-emerald-600 bg-emerald-50', label: '已完成' },
  pending: { icon: <Clock size={12} />, color: 'text-slate-500 bg-slate-50', label: '待执行' },
  missed: { icon: <X size={12} />, color: 'text-red-600 bg-red-50', label: '漏执行' },
  delayed: { icon: <Clock size={12} />, color: 'text-amber-600 bg-amber-50', label: '延迟' },
}

export default function CareTimeline({ records }: { records: CareRecord[] }) {
  if (records.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p>暂无护理记录</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-200" />
      <div className="space-y-4">
        {records.map((record) => {
          const tc = typeConfig[record.type] || typeConfig.other
          const sc = statusConfig[record.status] || statusConfig.pending

          return (
            <div key={record.id} className="relative flex gap-4">
              <div className={`relative z-10 w-10 h-10 rounded-full ${tc.bg} ${tc.color} flex items-center justify-center shrink-0 ring-2 ring-white`}>
                {tc.icon}
              </div>
              <div className={`flex-1 bg-white rounded-lg border p-3.5 ${
                record.is_abnormal ? 'border-red-200 bg-red-50/30' : 'border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded ${tc.bg} ${tc.color}`}>
                      {tc.icon}
                      {tc.label}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${sc.color}`}>
                      {sc.icon}
                      {sc.label}
                    </span>
                    {record.is_abnormal && (
                      <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">
                        <AlertTriangle size={10} />
                        异常
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-slate-400">{record.scheduled_at}</span>
                </div>
                <p className="text-sm text-slate-700 mb-1">{record.content}</p>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  {record.executed_by && <span>执行: {record.executed_by}</span>}
                  {record.executed_at && <span className="font-mono">{record.executed_at}</span>}
                </div>
                {record.abnormal_note && (
                  <div className="mt-2 text-xs bg-red-50 text-red-700 px-2.5 py-1.5 rounded border border-red-100">
                    ⚠ {record.abnormal_note}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
