import { useState } from 'react'
import type { FollowUp, FollowUpStatus } from '@/types'
import { ROLE_LABELS, STATUS_LABELS } from '@/types'
import { getAvailableActions } from '@/utils/statusEngine'
import { isIndicatorAbnormal } from '@/utils/warningEngine'
import { getTemplatesForDisease } from '@/utils/indicatorTemplates'
import { useRoleStore } from '@/store/useRoleStore'
import { useFollowUpStore } from '@/store/useFollowUpStore'
import { useWarningStore } from '@/store/useWarningStore'
import IndicatorChart from '@/components/IndicatorChart'
import StatusTimeline from '@/components/StatusTimeline'
import { X, ChevronRight, Plus, Minus } from 'lucide-react'

interface FollowUpDetailProps {
  followUp: FollowUp
  patientName: string
  patientAge: number
  patientGender: string
  diseaseType: string
  onClose: () => void
}

export default function FollowUpDetail({
  followUp,
  patientName,
  patientAge,
  patientGender,
  diseaseType,
  onClose,
}: FollowUpDetailProps) {
  const currentRole = useRoleStore((s) => s.currentRole)
  const addToast = useRoleStore((s) => s.addToast)
  const transitionStatus = useFollowUpStore((s) => s.transitionStatus)
  const addIndicator = useFollowUpStore((s) => s.addIndicator)
  const ingestPendingWarnings = useWarningStore((s) => s.ingestPendingWarnings)

  const templates = getTemplatesForDisease(diseaseType)
  const existingIndicatorNames = new Set(followUp.indicators.map((i) => i.name))
  const unrecordedTemplates = templates.filter((t) => !existingIndicatorNames.has(t.name))

  const [quickValues, setQuickValues] = useState<Record<string, string>>({})

  const actions = getAvailableActions(followUp.status, currentRole)
  const showIndicatorForm = followUp.status === 'in_progress' && (currentRole === 'nurse' || currentRole === 'doctor')

  function handleAction(targetStatus: FollowUpStatus) {
    if (targetStatus === 'completed') {
      const hasAbnormal = followUp.indicators.some(isIndicatorAbnormal)
      if (hasAbnormal) {
        const success = transitionStatus(followUp.id, 'warned', currentRole)
        if (success) {
          ingestPendingWarnings()
          addToast('warning', '发现异常指标，已自动转为预警状态')
        }
        return
      }
    }

    const success = transitionStatus(followUp.id, targetStatus, currentRole)
    if (success) {
      if (targetStatus === 'warned') {
        ingestPendingWarnings()
      }
      if (targetStatus === 'confirmed') {
        addToast('success', '预警已处理，随访闭环完成')
      } else {
        addToast('success', `状态已更新为${STATUS_LABELS[targetStatus]}`)
      }
    }
  }

  function handleQuickAdd(templateName: string) {
    const template = unrecordedTemplates.find((t) => t.name === templateName)
    if (!template) return
    const value = parseFloat(quickValues[templateName])
    if (isNaN(value)) {
      addToast('error', `请输入${template.name}的数值`)
      return
    }
    const result = addIndicator(
      followUp.id,
      { name: template.name, value, unit: template.unit, normalMin: template.normalMin, normalMax: template.normalMax },
      currentRole
    )
    ingestPendingWarnings()
    addToast(result.hasWarning ? 'warning' : 'success', result.hasWarning ? `${template.name}已录入，检测到${result.warningCount}项预警` : `${template.name}已录入`)
    setQuickValues((prev) => {
      const next = { ...prev }
      delete next[templateName]
      return next
    })
  }

  const variantStyles: Record<string, string> = {
    primary: 'bg-emerald-500 text-white hover:bg-emerald-600',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  }

  return (
    <div className="fixed right-0 top-0 z-50 flex h-full w-[480px] flex-col bg-white shadow-xl animate-slide-in-right">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{patientName}</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {patientGender} · {patientAge}岁 · {diseaseType}
          </p>
        </div>
        <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="border-b px-6 py-4">
          <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span>指标记录</span>
            {followUp.indicators.some(isIndicatorAbnormal) && (
              <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                存在异常
              </span>
            )}
          </div>
          <div className="mt-3">
            <IndicatorChart indicators={followUp.indicators} followUpId={followUp.id} />
          </div>
        </div>

        {showIndicatorForm && unrecordedTemplates.length > 0 && (
          <div className="border-b px-6 py-4">
            <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
              <Plus className="h-4 w-4 text-emerald-500" />
              <span>快捷录入</span>
              <span className="text-xs text-gray-400 ml-1">({diseaseType})</span>
            </div>
            <div className="mt-3 space-y-2">
              {unrecordedTemplates.map((tpl) => (
                <div key={tpl.name} className="flex items-center gap-2">
                  <div className="min-w-[120px]">
                    <span className="text-sm text-gray-700">{tpl.name}</span>
                    <span className="text-xs text-gray-400 ml-1">({tpl.normalMin}-{tpl.normalMax}{tpl.unit})</span>
                  </div>
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      value={quickValues[tpl.name] || ''}
                      onChange={(e) => setQuickValues((prev) => ({ ...prev, [tpl.name]: e.target.value }))}
                      placeholder="输入数值"
                      type="number"
                      step="any"
                      className="w-24 rounded border bg-white px-2 py-1.5 text-sm outline-none focus:border-emerald-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleQuickAdd(tpl.name)
                      }}
                    />
                    <span className="text-xs text-gray-400">{tpl.unit}</span>
                    <button
                      onClick={() => handleQuickAdd(tpl.name)}
                      className="rounded bg-emerald-500 px-2 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 transition-colors"
                    >
                      录入
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-b px-6 py-4">
          <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span>状态流转</span>
          </div>
          <div className="mt-3">
            <StatusTimeline logs={followUp.statusLogs} />
          </div>
        </div>

        <div className="px-6 py-4">
          <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span>操作</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {actions.map((action) => (
              <button
                key={action.targetStatus}
                onClick={() => handleAction(action.targetStatus)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${variantStyles[action.variant]}`}
              >
                {action.label}
              </button>
            ))}
            {actions.length === 0 && (
              <p className="text-sm text-gray-400">当前无可执行操作</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
