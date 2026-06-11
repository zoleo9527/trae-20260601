import { ROLE_LABELS } from '@/types';
import type { Role } from '@/types';

interface RoleBadgeProps {
  role: Role;
  className?: string;
}

export function RoleBadge({ role, className = '' }: RoleBadgeProps) {
  return (
    <span className={`badge role-badge-${role} border-0 ${className}`}>
      {ROLE_LABELS[role]}
    </span>
  );
}
