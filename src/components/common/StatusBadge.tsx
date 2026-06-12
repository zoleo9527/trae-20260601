import type { ApplicationStatus, InspectionStatus } from '@/types';
import { STATUS_LABELS, STATUS_COLORS, INSPECTION_LABELS, INSPECTION_COLORS } from '@/types';
import { classNames } from '@/utils/formatters';

interface StatusBadgeProps {
  status: ApplicationStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1.5 rounded font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        STATUS_COLORS[status]
      )}
    >
      <span className={classNames('w-1.5 h-1.5 rounded-full', 'currentColor opacity-70')}></span>
      {STATUS_LABELS[status]}
    </span>
  );
}

interface InspectionStatusBadgeProps {
  status: InspectionStatus;
}

export function InspectionStatusBadge({ status }: InspectionStatusBadgeProps) {
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium',
        INSPECTION_COLORS[status]
      )}
    >
      <span className={classNames('w-1.5 h-1.5 rounded-full', 'currentColor opacity-70')}></span>
      {INSPECTION_LABELS[status]}
    </span>
  );
}
