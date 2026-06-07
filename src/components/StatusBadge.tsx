import React from 'react';
import { BookingStatus, PackageOrderStatus, DecorationStatus, AnomalyStatus, AnomalySeverity } from '../types';
import { cn } from '../lib/utils';

interface StatusBadgeProps {
  status: BookingStatus | PackageOrderStatus | DecorationStatus | AnomalyStatus;
  type?: 'booking' | 'package' | 'decoration' | 'anomaly';
}

const statusConfig: Record<string, { label: string; className: string }> = {
  'booking-pending': { label: '待确认', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  'booking-confirmed': { label: '已确认', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  'booking-checked_in': { label: '已到店', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  'booking-completed': { label: '已完成', className: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  'booking-cancelled': { label: '已取消', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  
  'package-created': { label: '已创建', className: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  'package-processing': { label: '处理中', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  'package-completed': { label: '已完成', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  'package-cancelled': { label: '已取消', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  
  'decoration-pending': { label: '待布置', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  'decoration-in_progress': { label: '布置中', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  'decoration-completed': { label: '已完成', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  'decoration-restored': { label: '已还原', className: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  
  'anomaly-open': { label: '待处理', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  'anomaly-handling': { label: '处理中', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  'anomaly-resolved': { label: '已解决', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  'anomaly-ignored': { label: '已忽略', className: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'booking' }) => {
  const key = `${type}-${status}`;
  const config = statusConfig[key] || { label: status, className: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
  
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border',
      config.className
    )}>
      {config.label}
    </span>
  );
};

interface SeverityBadgeProps {
  severity: AnomalySeverity;
}

const severityConfig: Record<AnomalySeverity, { label: string; className: string }> = {
  high: { label: '高危', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  medium: { label: '中危', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  low: { label: '低危', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
};

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity }) => {
  const config = severityConfig[severity];
  
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border',
      config.className
    )}>
      {config.label}
    </span>
  );
};
