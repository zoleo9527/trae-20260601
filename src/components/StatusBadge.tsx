import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '../types/order';
import type { OrderStatus } from '../types/order';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge = ({ status, size = 'md' }: StatusBadgeProps) => {
  const colorClass = ORDER_STATUS_COLOR[status];
  const label = ORDER_STATUS_LABEL[status];
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${colorClass} ${sizeClass}`}
    >
      {label}
    </span>
  );
};
