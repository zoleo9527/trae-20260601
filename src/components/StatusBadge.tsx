import type { EmployeeStatus } from '@/types';
import { STATUS_LABEL, STATUS_COLOR } from '@/constants';

interface Props {
  status: EmployeeStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: Props) {
  const cls = STATUS_COLOR[status];
  const pad = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';
  return (
    <span className={`chip ${cls} ${pad}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
