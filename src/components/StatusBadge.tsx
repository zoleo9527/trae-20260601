import { STATUS_LABELS, STATUS_COLORS } from '../../shared/types';
import type { PrescriptionStatus } from '../../shared/types';
import { cn } from '../lib/utils';

interface StatusBadgeProps {
  status: PrescriptionStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded text-xs font-medium border',
        STATUS_COLORS[status],
        className
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
