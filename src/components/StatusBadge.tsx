import type { ApplicationStatus, MaterialStatus } from '../types';
import { STATUS_LABELS, MATERIAL_STATUS_LABELS } from '../types';
import { cn } from '../lib/utils';

interface StatusBadgeProps {
  status: ApplicationStatus | MaterialStatus;
  size?: 'sm' | 'md';
}

const statusStyles: Record<string, string> = {
  pending: 'bg-blue-50 text-blue-700 border-blue-200',
  correction: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  archived: 'bg-slate-50 text-slate-500 border-slate-200',
  submitted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  missing: 'bg-red-50 text-red-700 border-red-200',
  incorrect: 'bg-amber-50 text-amber-700 border-amber-200',
  corrected: 'bg-blue-50 text-blue-700 border-blue-200',
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const labels = 'submitted' in MATERIAL_STATUS_LABELS
    ? { ...STATUS_LABELS, ...MATERIAL_STATUS_LABELS }
    : STATUS_LABELS;
  const label = (labels as Record<string, string>)[status] || status;

  return (
    <span
      className={cn(
        'inline-flex items-center border rounded font-medium whitespace-nowrap',
        statusStyles[status] || 'bg-slate-50 text-slate-600 border-slate-200',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
      )}
    >
      {label}
    </span>
  );
}
