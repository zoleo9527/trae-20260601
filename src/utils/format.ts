import type { RecordStatus } from '@/types'

export function statusLabel(status: RecordStatus): string {
  const map: Record<RecordStatus, string> = {
    pending_reception: '待接车',
    pending_inspection: '待检测',
    pending_review: '待审核',
    completed: '已完成',
    returned: '已退回',
    rejected: '已终止',
  }
  return map[status]
}

export function statusColor(status: RecordStatus): string {
  const map: Record<RecordStatus, string> = {
    pending_reception: 'bg-sky-950/60 text-sky-300 border border-sky-800/50',
    pending_inspection: 'bg-violet-950/60 text-violet-300 border border-violet-800/50',
    pending_review: 'bg-amber-950/60 text-amber-300 border border-amber-800/50',
    completed: 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50',
    returned: 'bg-orange-950/60 text-orange-300 border border-orange-800/50',
    rejected: 'bg-red-950/60 text-red-300 border border-red-800/50',
  }
  return map[status]
}

export function statusDotColor(status: RecordStatus): string {
  const map: Record<RecordStatus, string> = {
    pending_reception: 'bg-sky-500',
    pending_inspection: 'bg-violet-500',
    pending_review: 'bg-amber-500',
    completed: 'bg-emerald-500',
    returned: 'bg-orange-500',
    rejected: 'bg-red-500',
  }
  return map[status]
}

export function roleLabel(role: string): string {
  const map: Record<string, string> = {
    receptionist: '接车员',
    inspector: '检测员',
    reviewer: '审核员',
  }
  return map[role] || role
}

export function actionLabel(action: string): string {
  const map: Record<string, string> = {
    created: '创建预约',
    received: '接车处理',
    inspected: '执行检测',
    approved: '审核通过',
    returned: '审核退回',
    supplemented: '补充备注',
    reinspected: '复检完成',
    reapproved: '复核通过',
    rejected: '审核终止',
  }
  return map[action] || action
}

export function formatTime(iso: string | null): string {
  if (!iso) return '-'
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
