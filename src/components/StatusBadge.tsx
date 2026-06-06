import { STATUS_LABELS, STATUS_COLORS } from '../../shared/types';
import type { RecordStatus } from '../../shared/types';

interface StatusBadgeProps {
  status: RecordStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const colorMap: Record<RecordStatus, string> = {
    pending: 'bg-slate-600 text-slate-100',
    checkin: 'bg-blue-600 text-blue-50',
    unloading: 'bg-amber-500 text-amber-50',
    finished: 'bg-cyan-600 text-cyan-50',
    discrepancy: 'bg-orange-500 text-orange-50',
    completed: 'bg-emerald-600 text-emerald-50',
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center rounded font-medium ${sizeClasses} ${colorMap[status]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${STATUS_COLORS[status]}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}
