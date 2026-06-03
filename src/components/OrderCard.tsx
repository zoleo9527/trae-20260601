import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Clock, Package, ExternalLink } from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import type { Order, Stage } from '@/types'
import { cn } from '@/lib/utils'

const stageLabels: Record<Stage, string> = {
  reception: '接收',
  design: '设计',
  qc: '质检',
  production: '排产',
}

const stageOrder: Stage[] = ['reception', 'design', 'qc']

function getStageIndex(stage: Stage): number {
  if (stage === 'production') return 3
  return stageOrder.indexOf(stage)
}

function StageProgress({ currentStage }: { currentStage: Stage }) {
  const idx = getStageIndex(currentStage)

  return (
    <div className="stage-progress">
      {stageOrder.map((stage, i) => (
        <div
          key={stage}
          className={cn(
            'stage-progress-segment',
            i < idx
              ? 'stage-progress-segment-filled'
              : i === idx
                ? 'stage-progress-segment-current'
                : 'stage-progress-segment-future'
          )}
        />
      ))}
    </div>
  )
}

function formatTimeInStage(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}分钟`
  if (hours < 24) return `${hours}小时`
  const d = Math.floor(hours / 24)
  const h = hours % 24
  return h > 0 ? `${d}天${h}小时` : `${d}天`
}

const productTypeColors: Record<string, string> = {
  '全瓷冠': 'bg-factory-amber/20 text-factory-amber',
  '贴面': 'bg-factory-blue/20 text-factory-blue',
  '活动义齿': 'bg-factory-green/20 text-factory-green',
  '种植修复': 'bg-purple-500/20 text-purple-400',
  '嵌体': 'bg-pink-500/20 text-pink-400',
}

export default function OrderCard({ order }: { order: Order }) {
  const navigate = useNavigate()
  const selectedOrderId = useAppStore((s) => s.selectedOrderId)
  const selectOrder = useAppStore((s) => s.selectOrder)
  const isSelected = selectedOrderId === order.id
  const hasAnomaly = order.anomalies.some((a) => !a.resolvedAt)
  const hasTimeout = order.anomalies.some((a) => a.type === 'timeout' && !a.resolvedAt)

  return (
    <div
      className={cn(
        'w-full text-left bg-factory-surface border rounded-lg p-4 transition hover:border-factory-amber group relative',
        isSelected ? 'border-factory-amber' : 'border-factory-border',
        hasAnomaly && 'anomaly-border'
      )}
    >
      {hasTimeout && (
        <div className="h-1 bg-factory-red rounded-t-lg -mt-4 -mx-4 mb-3 animate-pulse" />
      )}

      <div className="flex items-start justify-between mb-2">
        <span className="font-mono text-sm text-gray-300">{order.orderNo}</span>
        <div className="flex items-center gap-1.5">
          {order.priority === 'urgent' && (
            <span className="px-1.5 py-0.5 text-xs bg-factory-red/20 text-factory-red rounded">加急</span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/order/${order.id}`) }}
            className="opacity-0 group-hover:opacity-100 p-1 text-factory-muted hover:text-factory-amber transition"
            title="查看详情"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <button
        onClick={() => selectOrder(isSelected ? null : order.id)}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-200">{order.customerName}</span>
          <span className={cn('px-2 py-0.5 text-xs rounded-full', productTypeColors[order.productType] ?? 'bg-gray-500/20 text-gray-400')}>
            {order.productType}
          </span>
        </div>

        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-factory-muted">{stageLabels[order.currentStage]}</span>
            <span className="text-xs text-factory-muted">{formatTimeInStage(order.timeInStage)}</span>
          </div>
          <StageProgress currentStage={order.currentStage} />
        </div>

        {order.anomalies.filter((a) => !a.resolvedAt).length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            {order.anomalies.some((a) => a.type === 'missing_material' && !a.resolvedAt) && (
              <Package className="w-3.5 h-3.5 text-factory-red" />
            )}
            {order.anomalies.some((a) => a.type === 'timeout' && !a.resolvedAt) && (
              <Clock className="w-3.5 h-3.5 text-factory-red" />
            )}
            {order.anomalies.some((a) => a.type === 'qc_failed' && !a.resolvedAt) && (
              <AlertTriangle className="w-3.5 h-3.5 text-factory-red" />
            )}
          </div>
        )}
      </button>
    </div>
  )
}
