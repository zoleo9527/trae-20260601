import React from 'react';
import { cn } from '../lib/utils';
import { getStatusLabel } from '../data/mockData';

type StatusType =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'success'
  | 'failed'
  | 'stuck'
  | 'queued'
  | 'dispatching'
  | 'auditing'
  | 'approved'
  | 'rejected'
  | 'closed'
  | 'transferred'
  | 'online'
  | 'offline'
  | 'busy';

type PriorityType = 'high' | 'medium' | 'low';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles: Record<StatusType, string> = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    processing: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    failed: 'bg-red-100 text-red-700 border-red-200',
    stuck: 'bg-red-100 text-red-700 border-red-200',
    queued: 'bg-slate-100 text-slate-700 border-slate-200',
    dispatching: 'bg-blue-100 text-blue-700 border-blue-200',
    auditing: 'bg-orange-100 text-orange-700 border-orange-200',
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
    closed: 'bg-slate-100 text-slate-600 border-slate-200',
    transferred: 'bg-purple-100 text-purple-700 border-purple-200',
    online: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    offline: 'bg-slate-100 text-slate-500 border-slate-200',
    busy: 'bg-amber-100 text-amber-700 border-amber-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border',
        styles[status] || styles.pending,
        className
      )}
    >
      {getStatusLabel(status)}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: PriorityType;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const styles: Record<PriorityType, string> = {
    high: 'bg-red-50 text-red-700 border-red-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    low: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  const labels: Record<PriorityType, string> = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border',
        styles[priority],
        className
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full mr-1.5',
          priority === 'high' && 'bg-red-500 animate-pulse-alert',
          priority === 'medium' && 'bg-amber-500',
          priority === 'low' && 'bg-slate-400'
        )}
      />
      {labels[priority]}
    </span>
  );
}

interface DotStatusProps {
  status: 'online' | 'offline' | 'busy';
  className?: string;
}

export function DotStatus({ status, className }: DotStatusProps) {
  const colors: Record<string, string> = {
    online: 'bg-emerald-500',
    offline: 'bg-slate-400',
    busy: 'bg-amber-500',
  };

  return (
    <span
      className={cn(
        'w-2 h-2 rounded-full inline-block',
        status === 'online' && 'animate-pulse',
        colors[status],
        className
      )}
    />
  );
}
