import type { AnomalyStatus, AnomalyType, ParticipantStatus } from '@/types';

const statusConfig: Record<ParticipantStatus, { label: string; className: string }> = {
  registered: { label: '已报名', className: 'bg-zinc-600 text-zinc-200' },
  checked_in: { label: '已检录', className: 'bg-emerald-600/80 text-emerald-100' },
  withdrawn: { label: '已退赛', className: 'bg-red-600/80 text-red-100' },
  disqualified: { label: '取消资格', className: 'bg-red-800 text-red-200' },
}

const anomalyTypeConfig: Record<AnomalyType, { label: string; className: string }> = {
  id_mismatch: { label: '证件不符', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  duplicate_entry: { label: '重复报名', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  group_conflict: { label: '组别冲突', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  other: { label: '其他', className: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
}

const anomalyStatusConfig: Record<AnomalyStatus, { label: string; className: string }> = {
  pending: { label: '待处理', className: 'bg-amber-500/20 text-amber-400' },
  resolved: { label: '已解决', className: 'bg-emerald-500/20 text-emerald-400' },
  dismissed: { label: '已忽略', className: 'bg-zinc-500/20 text-zinc-400' },
}

export function StatusBadge({ status }: { status: ParticipantStatus }) {
  const config = statusConfig[status]
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

export function AnomalyTypeBadge({ type }: { type: AnomalyType }) {
  const config = anomalyTypeConfig[type]
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

export function AnomalyStatusBadge({ status }: { status: AnomalyStatus }) {
  const config = anomalyStatusConfig[status]
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

export function GroupBadge({ group }: { group: string }) {
  const colors: Record<string, string> = {
    '亲子组': 'bg-cyan-500/20 text-cyan-400',
    '公开组': 'bg-blue-500/20 text-blue-400',
    '企业团体': 'bg-violet-500/20 text-violet-400',
  }
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${colors[group] || 'bg-zinc-500/20 text-zinc-400'}`}>
      {group}
    </span>
  )
}
