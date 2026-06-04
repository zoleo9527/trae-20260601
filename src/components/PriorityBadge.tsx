import { cn } from '../utils/cn';

interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

const priorityConfig = {
  low: { label: '低', className: 'bg-gray-100 text-gray-600' },
  medium: { label: '中', className: 'bg-blue-100 text-blue-800' },
  high: { label: '高', className: 'bg-orange-100 text-orange-800' },
  urgent: { label: '紧急', className: 'bg-red-100 text-red-800' },
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const { label, className } = priorityConfig[priority];

  return (
    <span className={cn('badge', className)}>
      {label}优先级
    </span>
  );
}
