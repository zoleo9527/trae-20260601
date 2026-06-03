import { useSampleStore } from '@/store/sampleStore'
import { useShallow } from 'zustand/shallow'
import { useMemo } from 'react'
import { Clock, FlaskConical, CheckCircle2, AlertTriangle } from 'lucide-react'
import type { SampleRecord } from '@/types'

const cardConfig = [
  { key: 'pending' as const, label: '待处理', color: 'from-slate-600 to-slate-700', icon: Clock, accent: 'bg-slate-400' },
  { key: 'sampling' as const, label: '留样中', color: 'from-sky-600 to-sky-700', icon: FlaskConical, accent: 'bg-sky-400' },
  { key: 'completed' as const, label: '已完成', color: 'from-emerald-600 to-emerald-700', icon: CheckCircle2, accent: 'bg-emerald-400' },
  { key: 'abnormal' as const, label: '异常', color: 'from-amber-600 to-amber-700', icon: AlertTriangle, accent: 'bg-amber-400' },
]

function computeStats(records: SampleRecord[]) {
  return {
    pending: records.filter((r) => r.status === 'pending').length,
    sampling: records.filter((r) => r.status === 'sampling').length,
    completed: records.filter((r) => r.status === 'completed').length,
    abnormal: records.filter((r) => r.status === 'abnormal').length,
  }
}

export default function StatsPanel() {
  const records = useSampleStore(useShallow((s) => s.records))
  const setFilters = useSampleStore((s) => s.setFilters)
  const stats = useMemo(() => computeStats(records), [records])

  return (
    <div className="grid grid-cols-4 gap-4">
      {cardConfig.map((c, i) => {
        const Icon = c.icon
        const count = stats[c.key]
        return (
          <button
            key={c.key}
            onClick={() => setFilters({ status: c.key })}
            className="group relative overflow-hidden rounded-xl bg-gradient-to-br p-5 text-left text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${c.color}`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white/80">{c.label}</span>
                <Icon className="h-5 w-5 text-white/60 transition-colors group-hover:text-white/90" />
              </div>
              <div className="mt-2 font-mono text-3xl font-bold tracking-tight">
                {count}
              </div>
            </div>
            <div className={`absolute bottom-0 left-0 h-1 w-full ${c.accent} opacity-60`} />
          </button>
        )
      })}
    </div>
  )
}
