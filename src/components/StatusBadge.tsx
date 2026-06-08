import { Tag } from 'antd'
import type { DetentionStatus } from '../types'
import { STATUS_LABELS, STATUS_COLORS } from '../types'

interface StatusBadgeProps {
  status: DetentionStatus
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return <Tag color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Tag>
}
