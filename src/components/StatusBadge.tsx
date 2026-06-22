import type { WorkOrderStatus, Priority } from '../types';
import { statusLabels, priorityLabels } from '../types';

interface StatusBadgeProps {
  status: WorkOrderStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusStyles: Record<WorkOrderStatus, string> = {
    pending_dispatch: 'bg-neutral-100 text-neutral-700 border-neutral-300',
    dispatched: 'bg-primary-50 text-primary-700 border-primary-300',
    on_site: 'bg-warning-50 text-warning-600 border-warning-500',
    in_progress: 'bg-primary-50 text-primary-700 border-primary-300',
    returned: 'bg-danger-50 text-danger-600 border-danger-500',
    completed: 'bg-success-50 text-success-600 border-success-500',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: Priority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const priorityStyles: Record<Priority, string> = {
    urgent: 'bg-danger-50 text-danger-600 border-danger-500',
    high: 'bg-warning-50 text-warning-600 border-warning-500',
    medium: 'bg-primary-50 text-primary-700 border-primary-300',
    low: 'bg-neutral-100 text-neutral-600 border-neutral-300',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${priorityStyles[priority]}`}
    >
      {priorityLabels[priority]}
    </span>
  );
}
