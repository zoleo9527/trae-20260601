import type { ReactNode } from 'react';
import { BATCH_STATUS_COLORS, BATCH_STATUS_LABELS, ROLE_COLORS, ROLE_LABELS } from '@/types';
import type { BatchStatus, UserRole } from '@/types';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-hop-50 text-hop-green',
    warning: 'bg-warning-50 text-warning-orange',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-info-50 text-info-blue',
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

interface StatusBadgeProps {
  status: BatchStatus;
  showPulse?: boolean;
}

export function StatusBadge({ status, showPulse = false }: StatusBadgeProps) {
  const isAbnormal = status === 'TEST_ABNORMAL';
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${BATCH_STATUS_COLORS[status]} ${showPulse && isAbnormal ? 'animate-pulse-warning' : ''}`}>
      {BATCH_STATUS_LABELS[status]}
    </span>
  );
}

interface RoleBadgeProps {
  role: UserRole;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[role]}`}>
      {ROLE_LABELS[role]}
    </span>
  );
}
