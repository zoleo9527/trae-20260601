import type { InventoryStatus, ScreeningStatus, TodoPriority, RiskLevel } from '@/types'
import clsx from 'clsx'

export function StatusBadge({ status }: { status: InventoryStatus | ScreeningStatus }) {
  const configs: Record<string, { label: string; className: string }> = {
    pending: { label: '待处理', className: 'bg-warning-100 text-warning-600' },
    in_progress: { label: '处理中', className: 'bg-primary-100 text-primary-600' },
    resolved: { label: '已解决', className: 'bg-success-100 text-success-600' },
    escalated: { label: '已升级', className: 'bg-danger-100 text-danger-600' },
    normal: { label: '正常', className: 'bg-success-100 text-success-600' },
    hall_changed: { label: '已换厅', className: 'bg-warning-100 text-warning-600' },
    equipment_failure: { label: '设备故障', className: 'bg-danger-100 text-danger-600' },
    refund_issue: { label: '退票问题', className: 'bg-warning-100 text-warning-600' },
    completed: { label: '已完成', className: 'bg-gray-100 text-gray-600' },
  }
  const config = configs[status] || { label: status, className: 'bg-gray-100 text-gray-600' }
  return <span className={clsx('badge', config.className)}>{config.label}</span>
}

export function PriorityBadge({ priority }: { priority: TodoPriority }) {
  const configs: Record<TodoPriority, { label: string; className: string }> = {
    high: { label: '高', className: 'bg-danger-100 text-danger-600' },
    medium: { label: '中', className: 'bg-warning-100 text-warning-600' },
    low: { label: '低', className: 'bg-gray-100 text-gray-600' },
  }
  const config = configs[priority]
  return <span className={clsx('badge', config.className)}>{config.label}</span>
}

export function RiskLevelBadge({ level }: { level: RiskLevel }) {
  const configs: Record<RiskLevel, { label: string; className: string }> = {
    critical: { label: '严重', className: 'bg-danger-100 text-danger-600' },
    high: { label: '高', className: 'bg-danger-100 text-danger-600' },
    medium: { label: '中', className: 'bg-warning-100 text-warning-600' },
    low: { label: '低', className: 'bg-gray-100 text-gray-600' },
  }
  const config = configs[level]
  return <span className={clsx('badge', config.className)}>{config.label}</span>
}
