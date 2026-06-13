import {
  FileText,
  Calculator,
  Handshake,
  RotateCcw,
  AlertTriangle,
  Scale,
  MessageSquare,
  Zap,
  User,
} from 'lucide-react'
import { TIMELINE_ACTION_LABELS, ROLE_LABELS } from '@/types'
import type { TimelineEntry, TimelineAction } from '@/types'

const getIcon = (action: TimelineAction) => {
  if (action.startsWith('settlement_')) {
    if (action === 'settlement_returned') return RotateCcw
    if (action === 'settlement_disputed') return Scale
    return Calculator
  }
  if (action.startsWith('reconciliation_')) {
    if (action === 'reconciliation_discrepancy') return AlertTriangle
    if (action === 'reconciliation_disputed') return Scale
    return Handshake
  }
  if (action === 'record_created') return FileText
  if (action === 'supplement_added') return MessageSquare
  if (action === 'dispute_escalated') return Zap
  return FileText
}

const getColorClass = (action: TimelineAction) => {
  if (action === 'record_created') return 'text-gray-500 bg-gray-100 border-gray-200'
  if (action === 'settlement_confirmed' || action === 'reconciliation_confirmed')
    return 'text-emerald-600 bg-emerald-50 border-emerald-200'
  if (action === 'settlement_returned' || action === 'reconciliation_discrepancy')
    return 'text-amber-600 bg-amber-50 border-amber-200'
  if (action.endsWith('_disputed') || action === 'dispute_escalated')
    return 'text-purple-600 bg-purple-50 border-purple-200'
  if (action === 'supplement_added') return 'text-blue-600 bg-blue-50 border-blue-200'
  return 'text-blue-500 bg-blue-50 border-blue-200'
}

interface TimelineProps {
  entries: TimelineEntry[]
}

export default function Timeline({ entries }: TimelineProps) {
  const sorted = [...entries].sort((a, b) => a.timestamp.localeCompare(b.timestamp))

  return (
    <div className="space-y-0">
      {sorted.map((entry, idx) => {
        const Icon = getIcon(entry.action)
        const colorClass = getColorClass(entry.action)
        const isLast = idx === sorted.length - 1
        return (
          <div key={entry.id} className="relative flex gap-3">
            {!isLast && (
              <div className="absolute left-[15px] top-8 bottom-0 w-px bg-gray-200" />
            )}
            <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${colorClass}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-800">
                  {TIMELINE_ACTION_LABELS[entry.action] || entry.action}
                </span>
                <span className="text-[10px] text-gray-400">{entry.timestamp}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <User className="w-3 h-3" />
                <span>{ROLE_LABELS[entry.role]}</span>
                <span className="text-gray-300">·</span>
                <span>{entry.operator}</span>
              </div>
              {entry.note && (
                <div className="text-xs text-gray-600 bg-gray-50 rounded-md px-3 py-2 mt-1.5 border border-gray-100">
                  {entry.note}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
