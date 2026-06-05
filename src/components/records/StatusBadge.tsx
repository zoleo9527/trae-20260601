import { statusNames, type RecordStatus } from '@/types';

interface StatusBadgeProps {
  status: RecordStatus;
}

const statusStyles: Record<RecordStatus, string> = {
  pending_coach_confirm: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  pending_reception_handle: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  pending_manager_audit: 'bg-red-500/20 text-red-400 border-red-500/30',
  completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  disputed: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${statusStyles[status]}`}>
      {statusNames[status]}
    </span>
  );
}
