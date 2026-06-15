import type { Order, OrderStatus } from '@shared/types';
import { STATUS_LABEL } from '@shared/types';
import { AlertTriangle, Clock, UserX, ShieldAlert, Ban } from 'lucide-react';

const colorMap: Record<OrderStatus, string> = {
  PENDING_SELECTION: 'border-brass-500 bg-brass-50 text-brass-700',
  IN_SELECTION: 'border-ochre-600 bg-ochre-50 text-ochre-800',
  PENDING_QUOTE: 'border-blue-600 bg-blue-50 text-blue-700',
  QUOTE_REJECTED: 'border-red-600 bg-red-50 text-red-700',
  QUOTE_CONFIRMED: 'border-green-700 bg-green-50 text-green-800',
};

export interface ResponsibilityWarning {
  type: 'SELECTION_UNASSIGNED' | 'SELECTION_OVERDUE' | 'QUOTE_OVERDUE' | 'QUOTE_REJECTED_UNHANDLED' | 'QUOTE_UNASSIGNED' | 'EXCEPTION';
  label: string;
}

export function getResponsibilityWarnings(order: Order): ResponsibilityWarning[] {
  const warnings: ResponsibilityWarning[] = [];
  const now = Date.now();
  const created = new Date(order.createdAt).getTime();
  const hoursSinceCreated = (now - created) / 3600000;
  const updated = new Date(order.updatedAt).getTime();
  const hoursSinceUpdated = (now - updated) / 3600000;

  if (order.status === 'PENDING_SELECTION' && !order.selectionResponsible) {
    warnings.push({ type: 'SELECTION_UNASSIGNED', label: '选型未分配' });
    if (hoursSinceCreated > 4) warnings.push({ type: 'SELECTION_OVERDUE', label: '待选型超4h' });
  }
  if (order.status === 'IN_SELECTION' && hoursSinceUpdated > 8) {
    warnings.push({ type: 'SELECTION_OVERDUE', label: '选型超8h未提交' });
  }
  if (order.status === 'PENDING_QUOTE') {
    if (!order.selectionResponsible) warnings.push({ type: 'QUOTE_UNASSIGNED', label: '选型责任缺失' });
    if (hoursSinceUpdated > 4) warnings.push({ type: 'QUOTE_OVERDUE', label: '报价超4h未审' });
  }
  if (order.status === 'QUOTE_REJECTED' && hoursSinceUpdated > 2) {
    warnings.push({ type: 'QUOTE_REJECTED_UNHANDLED', label: '驳回超2h未重选' });
  }
  if (order.status === 'QUOTE_CONFIRMED' && (!order.quoteResponsible || !order.selectionResponsible)) {
    warnings.push({ type: 'QUOTE_UNASSIGNED', label: '责任记录不完整' });
  }
  if (order.isException && !warnings.find((w) => w.type === 'EXCEPTION')) {
    warnings.push({ type: 'EXCEPTION', label: order.exceptionReason || '异常工单' });
  }

  return warnings;
}

const warningStyles: Record<ResponsibilityWarning['type'], { style: string; icon: typeof AlertTriangle }> = {
  SELECTION_UNASSIGNED: { style: 'border-brass-500 bg-brass-50 text-brass-800', icon: UserX },
  SELECTION_OVERDUE: { style: 'border-ochre-700 bg-ochre-100 text-ochre-900', icon: Clock },
  QUOTE_OVERDUE: { style: 'border-blue-700 bg-blue-100 text-blue-900', icon: Clock },
  QUOTE_REJECTED_UNHANDLED: { style: 'border-red-700 bg-red-100 text-red-900', icon: Ban },
  QUOTE_UNASSIGNED: { style: 'border-carbon-600 bg-carbon-100 text-carbon-900', icon: ShieldAlert },
  EXCEPTION: { style: 'border-red-600 bg-red-50 text-red-800', icon: AlertTriangle },
};

interface Props {
  status: OrderStatus;
  warnings?: ResponsibilityWarning[];
  showWarnings?: boolean;
}

export default function StatusBadge({ status, warnings, showWarnings = true }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className={`status-badge ${colorMap[status]}`}>
        {STATUS_LABEL[status]}
      </span>
      {showWarnings && warnings && warnings.length > 0 && (
        warnings.map((w, i) => {
          const cfg = warningStyles[w.type];
          const Icon = cfg.icon;
          return (
            <span
              key={w.type + i}
              className={`flex items-center gap-1 px-2 py-0.5 border-2 font-mono text-[10px] uppercase tracking-wider ${cfg.style}`}
              title={w.label}
            >
              <Icon size={11} strokeWidth={2} />
              {w.label}
            </span>
          );
        })
      )}
    </div>
  );
}
