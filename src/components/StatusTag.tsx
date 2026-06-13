import type { RecordStatus, SettlementStatus, ReconciliationStatus } from '@/types'

const recordStatusStyles: Record<RecordStatus, string> = {
  normal: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  returned: 'bg-amber-50 text-amber-700 border-amber-200',
  overdue: 'bg-red-50 text-red-700 border-red-200',
  disputed: 'bg-purple-50 text-purple-700 border-purple-200',
}

const settlementStyles: Record<SettlementStatus, string> = {
  pending: 'bg-gray-50 text-gray-600 border-gray-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  returned: 'bg-amber-50 text-amber-700 border-amber-200',
  disputed: 'bg-purple-50 text-purple-700 border-purple-200',
}

const reconciliationStyles: Record<ReconciliationStatus, string> = {
  pending: 'bg-gray-50 text-gray-600 border-gray-200',
  sent: 'bg-blue-50 text-blue-700 border-blue-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  discrepancy: 'bg-amber-50 text-amber-700 border-amber-200',
  disputed: 'bg-purple-50 text-purple-700 border-purple-200',
}

interface StatusTagProps {
  label: string
  type: 'record' | 'settlement' | 'reconciliation'
  status: RecordStatus | SettlementStatus | ReconciliationStatus
  dot?: boolean
}

export default function StatusTag({ label, type, status, dot = true }: StatusTagProps) {
  let style = ''
  if (type === 'record') style = recordStatusStyles[status as RecordStatus] || ''
  else if (type === 'settlement') style = settlementStyles[status as SettlementStatus] || ''
  else style = reconciliationStyles[status as ReconciliationStatus] || ''

  const dotColors: Record<string, string> = {
    normal: 'bg-emerald-500',
    returned: 'bg-amber-500',
    overdue: 'bg-red-500',
    disputed: 'bg-purple-500',
    pending: 'bg-gray-400',
    processing: 'bg-blue-500',
    confirmed: 'bg-emerald-500',
    sent: 'bg-blue-500',
    discrepancy: 'bg-amber-500',
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${style}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status] || 'bg-gray-400'}`} />}
      {label}
    </span>
  )
}
