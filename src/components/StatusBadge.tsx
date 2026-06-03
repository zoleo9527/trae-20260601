import { STATUS_LABELS, STATUS_COLORS, OrderStatus } from '@/types';

interface StatusBadgeProps {
  status: OrderStatus;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, showLabel = true, size = 'md' }: StatusBadgeProps) {
  const label = STATUS_LABELS[status];
  const colorClass = STATUS_COLORS[status];
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${colorClass} ${sizeClass} font-medium transition-all duration-300`}
    >
      <span className={`h-2 w-2 rounded-full ${status === 'COMPLETED' ? 'bg-success-500' : status === 'REWORK' ? 'bg-danger-500 animate-pulse' : 'bg-warning-500 animate-pulse-slow'}`} />
      {showLabel && label}
    </span>
  );
}
