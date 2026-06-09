import type { Indicator } from '@/types'
import { isIndicatorAbnormal } from '@/utils/warningEngine'
import { AlertTriangle, Bell } from 'lucide-react'
import { useRoleStore } from '@/store/useRoleStore'
import { useWarningStore } from '@/store/useWarningStore'

interface IndicatorChartProps {
  indicators: Indicator[]
  followUpId: string
}

export default function IndicatorChart({ indicators, followUpId }: IndicatorChartProps) {
  const addToast = useRoleStore((s) => s.addToast)
  const executeAction = useWarningStore((s) => s.executeAction)
  const currentRole = useRoleStore((s) => s.currentRole)
  const warnings = useWarningStore((s) => s.warnings)

  function handleTriggerRemind(indicatorId: string) {
    const warning = warnings.find(
      (w) => w.followUpId === followUpId && w.indicatorId === indicatorId && (w.status === 'active' || w.status === 'processing')
    )
    if (warning) {
      executeAction(warning.id, 'remind', currentRole)
      addToast('success', `已提醒${warning.assigneeName}处理${warning.ruleName}`)
    } else {
      addToast('info', '该指标暂无活跃预警')
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {indicators.map((ind) => {
        const abnormal = isIndicatorAbnormal(ind)
        const relatedWarning = warnings.find(
          (w) => w.followUpId === followUpId && w.indicatorId === ind.id && (w.status === 'active' || w.status === 'processing')
        )
        return (
          <div
            key={ind.id}
            className={`min-w-[140px] rounded-lg border p-3 transition-shadow hover:shadow-sm ${
              abnormal
                ? 'border-red-200 bg-red-50'
                : 'border-slate-200 bg-white'
            }`}
          >
            <div className="text-xs text-slate-500">{ind.name}</div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className={`text-lg font-semibold ${abnormal ? 'text-red-600' : 'text-slate-800'}`}>
                {ind.value}
              </span>
              <span className="text-xs text-slate-400">{ind.unit}</span>
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {ind.normalMin}–{ind.normalMax} {ind.unit}
            </div>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  abnormal
                    ? 'bg-red-100 text-red-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {abnormal ? '异常' : '正常'}
              </span>
              {abnormal && relatedWarning && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTriggerRemind(ind.id)
                  }}
                  className="inline-flex items-center gap-0.5 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 hover:bg-orange-200 transition-colors"
                >
                  <Bell className="w-3 h-3" />
                  触发提醒
                </button>
              )}
              {abnormal && !relatedWarning && (
                <span className="inline-flex items-center gap-0.5 text-xs text-red-400">
                  <AlertTriangle className="w-3 h-3" />
                  待预警
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
