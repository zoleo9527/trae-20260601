import { cn } from '../lib/utils';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'amber';
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, variant = 'default', size = 'sm' }: StatusBadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    amber: 'bg-amber-100 text-amber-700',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span className={cn('status-badge', variants[variant], sizes[size])}>
      {status}
    </span>
  );
}
