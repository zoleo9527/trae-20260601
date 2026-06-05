import { STATUS_LABELS, type ComplaintStatus } from '../../shared/types';

interface StatusBadgeProps {
  status: ComplaintStatus;
}

const statusStyles: Record<ComplaintStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending_review: 'bg-amber-100 text-amber-700',
  review_rejected: 'bg-rose-100 text-rose-700',
  pending_compensation: 'bg-blue-100 text-blue-700',
  compensation_rejected: 'bg-rose-100 text-rose-700',
  completed: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-gray-100 text-gray-600',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`status-badge ${statusStyles[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
