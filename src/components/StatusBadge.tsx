import type { InstrumentStatus, ReservationStatus, SampleStatus } from '@/types';

const reservationStatusMap: Record<ReservationStatus, { label: string; color: string; bg: string }> = {
  pending: { label: '待审批', color: 'text-amber-400', bg: 'bg-amber-500/15' },
  approved: { label: '已通过', color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  rejected: { label: '已驳回', color: 'text-red-400', bg: 'bg-red-500/15' },
  postponed: { label: '顺延中', color: 'text-yellow-300', bg: 'bg-yellow-500/15' },
  cancelled: { label: '已取消', color: 'text-zinc-500', bg: 'bg-zinc-500/15' },
}

const sampleStatusMap: Record<SampleStatus, { label: string; color: string; bg: string }> = {
  waiting: { label: '待测', color: 'text-amber-400', bg: 'bg-amber-500/15' },
  testing: { label: '检测中', color: 'text-blue-400', bg: 'bg-blue-500/15' },
  done: { label: '完成', color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  abnormal: { label: '异常', color: 'text-red-400', bg: 'bg-red-500/15' },
}

const instrumentStatusMap: Record<InstrumentStatus, { label: string; color: string; bg: string; dot: string }> = {
  normal: { label: '正常', color: 'text-emerald-400', bg: 'bg-emerald-500/15', dot: 'bg-emerald-500' },
  fault: { label: '故障', color: 'text-red-400', bg: 'bg-red-500/15', dot: 'bg-red-500' },
  maintenance: { label: '维护', color: 'text-blue-400', bg: 'bg-blue-500/15', dot: 'bg-blue-500' },
}

export function ReservationBadge({ status }: { status: ReservationStatus }) {
  const info = reservationStatusMap[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${info.color} ${info.bg}`}>
      {info.label}
    </span>
  )
}

export function SampleBadge({ status }: { status: SampleStatus }) {
  const info = sampleStatusMap[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${info.color} ${info.bg}`}>
      {info.label}
    </span>
  )
}

export function InstrumentStatusDot({ status }: { status: InstrumentStatus }) {
  const info = instrumentStatusMap[status]
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${info.dot} ${status === 'fault' ? 'animate-fault' : ''}`} />
  )
}

export function InstrumentBadge({ status }: { status: InstrumentStatus }) {
  const info = instrumentStatusMap[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${info.color} ${info.bg}`}>
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${info.dot} ${status === 'fault' ? 'animate-fault' : ''}`} />
      {info.label}
    </span>
  )
}
