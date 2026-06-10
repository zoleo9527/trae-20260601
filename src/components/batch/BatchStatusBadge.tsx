import type { BatchStatus } from '@/types'
import { BATCH_STATUS_MAP } from '@/types'
import StatusBadge from '@/components/shared/StatusBadge'

interface BatchStatusBadgeProps {
  status: BatchStatus
}

export default function BatchStatusBadge({ status }: BatchStatusBadgeProps) {
  const { label, color, bg } = BATCH_STATUS_MAP[status]
  return <StatusBadge label={label} colorClass={color} bgClass={bg} />
}
