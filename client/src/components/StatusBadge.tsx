import type { TourGroupStatus } from '../types';
import { STATUS_LABELS } from '../types';

const statusStyles: Record<TourGroupStatus, string> = {
  pending_dispatch: 'bg-slate-100 text-slate-700 border-slate-300',
  dispatched: 'bg-blue-50 text-blue-700 border-blue-300',
  checked_in: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  fleet_ready: 'bg-teal-50 text-teal-700 border-teal-300',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-400',
  stuck: 'bg-amber-50 text-amber-800 border-amber-400 animate-pulse',
};

interface StatusBadgeProps {
  status: TourGroupStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusStyles[status]}`}
    >
      {status === 'stuck' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-ping" />}
      {STATUS_LABELS[status]}
    </span>
  );
}
