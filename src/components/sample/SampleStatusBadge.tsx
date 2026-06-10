import type { SampleStatus } from '@/types'
import { SAMPLE_STATUS_MAP } from '@/types'
import StatusBadge from '@/components/shared/StatusBadge'

interface SampleStatusBadgeProps {
  status: SampleStatus
}

export default function SampleStatusBadge({ status }: SampleStatusBadgeProps) {
  const { label, color, bg } = SAMPLE_STATUS_MAP[status]
  return <StatusBadge label={label} colorClass={color} bgClass={bg} />
}
