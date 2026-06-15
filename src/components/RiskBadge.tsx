import type { RiskType, RiskSeverity, RiskStatus } from '@/types'
import { cn } from '@/lib/utils'
import { AlertTriangle, DollarSign, Bug, RefreshCw } from 'lucide-react'

const typeConfig: Record<RiskType, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  price_regret: {
    label: '估价反悔',
    icon: <DollarSign className="w-3 h-3" />,
    color: 'text-red-300',
    bg: 'bg-red-500/20',
    border: 'border-red-500/30',
  },
  hidden_defect: {
    label: '暗病争议',
    icon: <Bug className="w-3 h-3" />,
    color: 'text-orange-300',
    bg: 'bg-orange-500/20',
    border: 'border-orange-500/30',
  },
  payment_error: {
    label: '打款异常',
    icon: <AlertTriangle className="w-3 h-3" />,
    color: 'text-red-300',
    bg: 'bg-red-500/20',
    border: 'border-red-500/30',
  },
  review: {
    label: '复盘提醒',
    icon: <RefreshCw className="w-3 h-3" />,
    color: 'text-yellow-300',
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/30',
  },
}

const severityDot: Record<RiskSeverity, string> = {
  high: 'bg-red-400',
  medium: 'bg-yellow-400',
  low: 'bg-blue-400',
}

const statusLabel: Record<RiskStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
}

export default function RiskBadge({ type }: { type: RiskType }) {
  return <RiskTypeBadge type={type} />
}

export function RiskTypeBadge({ type, size = 'md' }: { type: RiskType; size?: 'sm' | 'md' }) {
  const config = typeConfig[type]
  const sizeCls =
    size === 'sm' ? 'px-1.5 py-0 text-[10px] gap-0.5' :
    'px-2 py-0.5 text-xs gap-1'
  return (
    <span className={cn('inline-flex items-center rounded font-medium border', config.bg, config.color, config.border, sizeCls)}>
      {config.icon}
      {config.label}
    </span>
  )
}

export function RiskSeverityDot({ severity }: { severity: RiskSeverity }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
      <span className={cn('w-2 h-2 rounded-full', severityDot[severity])} />
      {severity === 'high' ? '高' : severity === 'medium' ? '中' : '低'}
    </span>
  )
}

export function RiskStatusLabel({ status }: { status: RiskStatus }) {
  return (
    <span className={cn(
      'text-xs px-1.5 py-0.5 rounded',
      status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
      status === 'processing' ? 'bg-blue-500/20 text-blue-300' :
      'bg-green-500/20 text-green-300'
    )}>
      {statusLabel[status]}
    </span>
  )
}
