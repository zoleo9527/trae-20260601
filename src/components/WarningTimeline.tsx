import type { WarningAction } from '@/types'
import { ROLE_LABELS } from '@/types'
import { formatTimeAgo } from '@/utils/statusEngine'
import { cn } from '@/lib/utils'

const ACTION_LABELS: Record<WarningAction['actionType'], string> = {
  remind: '提醒',
  confirm: '确认',
  return: '退回',
  assign: '派单',
  batch_confirm: '批量确认',
  batch_assign: '批量派单',
  batch_return: '批量退回',
}

const ACTION_DOT: Record<WarningAction['actionType'], string> = {
  remind: 'bg-emerald-500',
  confirm: 'bg-blue-500',
  return: 'bg-orange-500',
  assign: 'bg-purple-500',
  batch_confirm: 'bg-blue-500',
  batch_assign: 'bg-purple-500',
  batch_return: 'bg-orange-500',
}

interface WarningTimelineProps {
  actions: WarningAction[]
}

export function WarningTimeline({ actions }: WarningTimelineProps) {
  return (
    <div className="relative pl-4">
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" />

      <div className="space-y-3">
        {actions.map((action) => (
          <div key={action.id} className="relative flex items-start gap-3">
            <div
              className={cn(
                'absolute left-[-9px] top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white',
                ACTION_DOT[action.actionType]
              )}
            />

            <div className="flex-1 min-w-0 ml-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-800">
                  {ACTION_LABELS[action.actionType]}
                </span>
                <span className="text-xs text-gray-500">
                  {action.operatorName}·{ROLE_LABELS[action.operatorRole]}
                </span>
                <span className="text-xs text-gray-400">
                  {formatTimeAgo(action.operatedAt)}
                </span>
              </div>
              {action.remark && (
                <p className="text-xs text-gray-500 mt-0.5">{action.remark}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
