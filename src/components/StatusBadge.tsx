import { statusMap } from '../utils/format';
import type { ReminderStatus } from '../../shared/types';

interface StatusBadgeProps {
  status: ReminderStatus;
  pulse?: boolean;
}

export default function StatusBadge({ status, pulse = false }: StatusBadgeProps) {
  const cfg = statusMap[status];
  return (
    <span className={`status-badge ${cfg.className}`}>
      <span
        className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass} ${pulse ? 'animate-pulse-dot' : ''}`}
      />
      {cfg.label}
    </span>
  );
}
