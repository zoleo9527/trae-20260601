import { AlertType, AlertLevel, ALERT_TYPE_LABELS, ALERT_LEVEL_LABELS } from '@/lib/types'

const typeColors: Record<AlertType, string> = {
  PLAN_DISRUPTED: 'bg-amber-50 text-amber-800 border-amber-200',
  ASSESSMENT_NOT_FOLLOWED: 'bg-blue-50 text-blue-800 border-blue-200',
  EQUIPMENT_CONFLICT: 'bg-red-50 text-red-800 border-red-200',
}

const levelIcons: Record<AlertLevel, string> = {
  HIGH: '🔴',
  MEDIUM: '🟡',
  LOW: '🟢',
}

interface Props {
  type: AlertType
  level: AlertLevel
  message: string
  resolved?: boolean
}

export default function AlertBadge({ type, level, message, resolved }: Props) {
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${typeColors[type]} ${resolved ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-2">
        <span>{levelIcons[level]}</span>
        <span className="font-medium">{ALERT_TYPE_LABELS[type]}</span>
        <span className="text-xs opacity-70">({ALERT_LEVEL_LABELS[level]})</span>
        {resolved && <span className="text-xs ml-auto">已处理</span>}
      </div>
      <p className="mt-1 text-xs">{message}</p>
    </div>
  )
}
