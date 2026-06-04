import type { VisitStatus, CommunicationStatus } from '../types';
import { cn } from '../utils/cn';

interface StatusBadgeProps {
  status: VisitStatus | CommunicationStatus;
  type?: 'visit' | 'communication';
}

const visitStatusConfig: Record<VisitStatus, { label: string; className: string }> = {
  pending_approval: { label: '待审批', className: 'bg-yellow-100 text-yellow-800' },
  approved: { label: '已批准', className: 'bg-blue-100 text-blue-800' },
  rejected: { label: '已拒绝', className: 'bg-red-100 text-red-800' },
  checked_in: { label: '已签到', className: 'bg-green-100 text-green-800' },
  completed: { label: '已完成', className: 'bg-gray-100 text-gray-800' },
  cancelled: { label: '已取消', className: 'bg-gray-100 text-gray-600' },
  pending_followup: { label: '待跟进', className: 'bg-orange-100 text-orange-800' },
  stuck: { label: '⚠️ 卡住', className: 'bg-red-100 text-red-800 animate-pulse' },
};

const communicationStatusConfig: Record<CommunicationStatus, { label: string; className: string }> = {
  pending: { label: '待处理', className: 'bg-yellow-100 text-yellow-800' },
  in_progress: { label: '处理中', className: 'bg-blue-100 text-blue-800' },
  completed: { label: '已完成', className: 'bg-green-100 text-green-800' },
  stuck: { label: '⚠️ 卡住', className: 'bg-red-100 text-red-800 animate-pulse' },
  escalated: { label: '⚠️ 已升级', className: 'bg-red-100 text-red-800 animate-pulse' },
};

export function StatusBadge({ status, type = 'visit' }: StatusBadgeProps) {
  const config = type === 'visit' 
    ? (visitStatusConfig as Record<string, { label: string; className: string }>)
    : (communicationStatusConfig as Record<string, { label: string; className: string }>);
  const { label, className } = config[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

  return (
    <span className={cn('badge', className)}>
      {label}
    </span>
  );
}
