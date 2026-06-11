import { STATUS_LABELS } from '@/types';
import type { PromotionStatus } from '@/types';

interface StatusBadgeProps {
  status: PromotionStatus;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span className={`badge status-badge-${status} ${className}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
