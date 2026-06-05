import { PRIORITY_LABELS, type Priority } from '../../shared/types';

interface PriorityBadgeProps {
  priority: Priority;
}

const priorityStyles: Record<Priority, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-50 text-blue-600',
  high: 'bg-orange-50 text-orange-600',
  urgent: 'bg-rose-50 text-rose-600',
};

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span className={`status-badge ${priorityStyles[priority]}`}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
