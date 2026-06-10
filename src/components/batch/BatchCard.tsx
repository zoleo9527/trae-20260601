import type { ProductionBatch, BatchStatus } from '@/types'
import { cn } from '@/lib/utils'
import { Play, CheckCircle, Eye, RefreshCw } from 'lucide-react'
import BatchStatusBadge from './BatchStatusBadge'

const STATUS_BORDER_COLORS: Record<BatchStatus, string> = {
  abnormal: 'border-l-red-500',
  pending_qc: 'border-l-orange-500',
  pending_feed: 'border-l-amber-500',
  in_production: 'border-l-blue-500',
  completed: 'border-l-emerald-500',
}

const STATUS_ACTIONS: Record<BatchStatus, { label: string; icon: React.ElementType; action: string } | null> = {
  pending_feed: { label: '开始投料', icon: Play, action: 'start_feed' },
  in_production: { label: '提交质检', icon: CheckCircle, action: 'submit_qc' },
  pending_qc: { label: '查看质检', icon: Eye, action: 'view_sample' },
  abnormal: { label: '重新质检', icon: RefreshCw, action: 're_qc' },
  completed: null,
}

function getRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  return new Date(timestamp).toLocaleDateString('zh-CN')
}

interface BatchCardProps {
  batch: ProductionBatch
  onAction: (action: string) => void
}

export default function BatchCard({ batch, onAction }: BatchCardProps) {
  const actionConfig = STATUS_ACTIONS[batch.status]

  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-slate-200 border-l-4 shadow-sm',
        'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer',
        STATUS_BORDER_COLORS[batch.status]
      )}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <span className="text-base font-bold text-slate-900">{batch.batchNo}</span>
          <BatchStatusBadge status={batch.status} />
        </div>

        <div className="space-y-2 mb-3">
          <p className="text-sm text-slate-600">{batch.formulaName}</p>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>计划: {batch.plannedQty}吨</span>
            {batch.actualQty !== null && <span>实际: {batch.actualQty}吨</span>}
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${batch.progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-400">{batch.progress}%</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {actionConfig && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onAction(actionConfig.action)
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <actionConfig.icon className="w-3.5 h-3.5" />
                {actionConfig.label}
              </button>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">{batch.lastModifiedBy}</p>
            <p className="text-xs text-slate-400">{getRelativeTime(batch.updatedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
