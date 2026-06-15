import type { OrderStatus } from '@shared/types';
import { STATUS_LABEL } from '@shared/types';

const colorMap: Record<OrderStatus, string> = {
  PENDING_SELECTION: 'border-brass-500 bg-brass-50 text-brass-700',
  IN_SELECTION: 'border-ochre-600 bg-ochre-50 text-ochre-800',
  PENDING_QUOTE: 'border-blue-600 bg-blue-50 text-blue-700',
  QUOTE_REJECTED: 'border-red-600 bg-red-50 text-red-700',
  QUOTE_CONFIRMED: 'border-green-700 bg-green-50 text-green-800',
};

interface Props {
  status: OrderStatus;
}

export default function StatusBadge({ status }: Props) {
  return (
    <span className={`status-badge ${colorMap[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
