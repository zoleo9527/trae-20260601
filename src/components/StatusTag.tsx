import type { ReminderStatus, ReportStatus } from '@/types'
import { REMINDER_STATUS_LABELS, REPORT_STATUS_LABELS } from '@/types'

type TagStatus = ReminderStatus | ReportStatus

interface StatusTagProps {
  status: TagStatus
  onClick?: () => void
  pulse?: boolean
}

const STATUS_STYLE_MAP: Record<TagStatus, string> = {
  pending: 'bg-zinc-100 text-zinc-700',
  confirmed: 'bg-primary-50 text-primary-700',
  abnormal: 'bg-amber-50 text-amber-700',
  timeout: 'bg-red-50 text-red-700',
  draft: 'bg-zinc-100 text-zinc-700',
  submitted: 'bg-blue-50 text-blue-700',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
  supplemented: 'bg-purple-50 text-purple-700',
}

function getLabel(status: TagStatus): string {
  if (status in REMINDER_STATUS_LABELS) {
    return REMINDER_STATUS_LABELS[status as ReminderStatus]
  }
  return REPORT_STATUS_LABELS[status as ReportStatus]
}

export function StatusTag({ status, onClick, pulse }: StatusTagProps) {
  const baseClasses = `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE_MAP[status]}`
  const pulseClass = status === 'timeout' ? 'animate-pulse' : ''
  const interactiveClass = onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''

  return (
    <span
      className={`${baseClasses} ${pulseClass} ${interactiveClass}`}
      onClick={onClick}
    >
      {getLabel(status)}
    </span>
  )
}
