import type { AppointmentStatus, ScaleStatus, RiskCaseStatus, TriageStatus, RiskLevel } from '../types';

interface StatusBadgeProps {
  type: 'appointment' | 'scale' | 'risk' | 'triage' | 'riskLevel';
  status: AppointmentStatus | ScaleStatus | RiskCaseStatus | TriageStatus | RiskLevel;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  scheduled: { label: '已预约', className: 'badge badge-info' },
  rescheduled: { label: '改期待确认', className: 'badge badge-pending' },
  completed: { label: '已完成', className: 'badge badge-completed' },
  cancelled: { label: '已取消', className: 'badge badge-completed' },
  pending: { label: '待分诊', className: 'badge badge-pending' },
  not_sent: { label: '未发送', className: 'badge badge-completed' },
  sent: { label: '待填写', className: 'badge badge-info' },
  submitted: { label: '已提交', className: 'badge badge-normal' },
  retest_needed: { label: '需复测', className: 'badge badge-warning' },
  retest_submitted: { label: '复测已交', className: 'badge badge-normal' },
  pending_review: { label: '待审核', className: 'badge badge-warning' },
  reviewed: { label: '已审核', className: 'badge badge-info' },
  action_taken: { label: '已处理', className: 'badge badge-normal' },
  assigned: { label: '已分配', className: 'badge badge-normal' },
  low: { label: '低', className: 'badge badge-normal' },
  medium: { label: '中', className: 'badge badge-pending' },
  high: { label: '高', className: 'badge badge-warning' },
  critical: { label: '极高', className: 'badge bg-red-100 text-red-700' },
};

export function StatusBadge({ type, status }: StatusBadgeProps) {
  const config = statusConfig[status];
  if (!config) return null;

  return <span className={config.className}>{config.label}</span>;
}

export function TypeBadge({ type }: { type: 'initial' | 'followup' }) {
  return (
    <span className={type === 'initial' ? 'badge bg-blue-50 text-blue-700' : 'badge bg-violet-50 text-violet-700'}>
      {type === 'initial' ? '初访' : '复访'}
    </span>
  );
}
