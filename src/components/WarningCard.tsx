import type { Warning, WarningActionType, FollowUpStatus } from '@/types'
import { WARNING_LEVEL_LABELS, WARNING_STATUS_LABELS, STATUS_LABELS } from '@/types'
import { formatTimeAgo } from '@/utils/statusEngine'
import { useFollowUpStore } from '@/store/useFollowUpStore'
import { WarningTimeline } from '@/components/WarningTimeline'
import { Bell, RotateCcw, ChevronDown, ChevronUp, ExternalLink, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const FOLLOWUP_STATUS_BADGE: Record<FollowUpStatus, string> = {
  pending: 'bg-gray-50 text-gray-600 border-gray-200',
  in_progress: 'bg-blue-50 text-blue-600 border-blue-200',
  pending_review: 'bg-amber-50 text-amber-600 border-amber-200',
  completed: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  warned: 'bg-red-50 text-red-600 border-red-200',
  confirmed: 'bg-teal-50 text-teal-600 border-teal-200',
}

const LEVEL_BAR: Record<Warning['level'], string> = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-500',
}

const LEVEL_BADGE: Record<Warning['level'], string> = {
  red: 'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-700',
  yellow: 'bg-yellow-100 text-yellow-700',
}

const STATUS_BADGE: Record<Warning['status'], string> = {
  active: 'bg-red-50 text-red-600 border-red-200',
  processing: 'bg-blue-50 text-blue-600 border-blue-200',
  resolved: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  returned: 'bg-orange-50 text-orange-600 border-orange-200',
}

interface WarningCardProps {
  warning: Warning
  isSelected: boolean
  onToggleSelect: () => void
  onAction: (actionType: WarningActionType) => void
  expanded: boolean
  onToggleExpand: () => void
  onNavigateToFollowUp?: (followUpId: string) => void
}

export default function WarningCard({
  warning,
  isSelected,
  onToggleSelect,
  onAction,
  expanded,
  onToggleExpand,
  onNavigateToFollowUp,
}: WarningCardProps) {
  const followUp = useFollowUpStore((s) =>
    s.followUps.find((fu) => fu.id === warning.followUpId)
  )
  const getPatientById = useFollowUpStore((s) => s.getPatientById)
  const patient = followUp ? getPatientById(followUp.patientId) : undefined

  const indicator = warning.indicatorId
    ? followUp?.indicators.find((ind) => ind.id === warning.indicatorId)
    : undefined

  const isActive = warning.status === 'active' || warning.status === 'processing'

  return (
    <div
      className={cn(
        'rounded-lg border bg-white shadow-sm overflow-hidden',
        isSelected && 'ring-2 ring-blue-400',
        isActive && 'border-l-0'
      )}
    >
      <div className="flex">
        <div className={cn('w-1.5 shrink-0', LEVEL_BAR[warning.level])} />

        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
            />
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0',
                LEVEL_BADGE[warning.level]
              )}
            >
              {WARNING_LEVEL_LABELS[warning.level]}
            </span>
            <span className="font-medium text-sm text-gray-900 truncate">
              {warning.ruleName}
            </span>
            <span className={cn(
              'inline-flex items-center rounded-full border px-1.5 py-0.5 text-xs font-medium shrink-0',
              STATUS_BADGE[warning.status]
            )}>
              {WARNING_STATUS_LABELS[warning.status]}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
            {patient && (
              <span>
                {patient.name} · {patient.gender} · {patient.age}岁
              </span>
            )}
            {indicator && (
              <span className="text-red-600 font-medium">
                {indicator.name} {indicator.value}{indicator.unit}
                <span className="text-gray-400 ml-1">
                  (参考 {indicator.normalMin}-{indicator.normalMax}{indicator.unit})
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
            <span>负责人: {warning.assigneeName}</span>
            <span>{formatTimeAgo(warning.triggeredAt)}</span>
            {followUp && (
              <span className="inline-flex items-center gap-1">
                <Link2 className="h-3 w-3" />
                随访:
                <span className={cn(
                  'inline-flex items-center rounded-full border px-1.5 py-0.5 text-xs font-medium',
                  FOLLOWUP_STATUS_BADGE[followUp.status]
                )}>
                  {STATUS_LABELS[followUp.status]}
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isActive && (
                <>
                  <button
                    onClick={() => onAction('remind')}
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
                  >
                    <Bell className="h-3.5 w-3.5" />
                    触发提醒
                  </button>
                  <button
                    onClick={() => onAction('return')}
                    className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700 hover:bg-orange-100 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    退回
                  </button>
                </>
              )}
              {warning.status === 'active' && (
                <button
                  onClick={() => onAction('confirm')}
                  className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  确认处理
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {onNavigateToFollowUp && followUp && (
                <button
                  onClick={() => onNavigateToFollowUp(followUp.id)}
                  className="inline-flex items-center gap-0.5 text-xs text-blue-500 hover:text-blue-700 transition-colors"
                >
                  查看随访
                  <ExternalLink className="h-3 w-3" />
                </button>
              )}
              {warning.actions.length > 0 && (
                <button
                  onClick={onToggleExpand}
                  className="inline-flex items-center gap-0.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {expanded ? (
                    <>
                      收起 <ChevronUp className="h-3.5 w-3.5" />
                    </>
                  ) : (
                    <>
                      处理记录 ({warning.actions.length}){' '}
                      <ChevronDown className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {expanded && warning.actions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <WarningTimeline actions={warning.actions} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
