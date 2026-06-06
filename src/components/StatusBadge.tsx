import { RefundStatus, VisitStatus } from '@/types';
import { AlertTriangle, CheckCircle, Clock, XCircle, RotateCcw, Users, Phone, CheckSquare, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: RefundStatus | VisitStatus;
  type?: 'refund' | 'visit';
}

const refundStatusConfig: Record<RefundStatus, { label: string; className: string; icon: React.ElementType }> = {
  '待审核': { label: '待审核', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
  '审核中': { label: '审核中', className: 'bg-blue-100 text-blue-800', icon: Clock },
  '已通过': { label: '已通过', className: 'bg-green-100 text-green-800', icon: CheckCircle },
  '已拒绝': { label: '已拒绝', className: 'bg-red-100 text-red-800', icon: XCircle },
  '已退回': { label: '已退回', className: 'bg-orange-100 text-orange-800', icon: RotateCcw },
  '异常': { label: '异常', className: 'bg-red-100 text-red-800', icon: AlertTriangle },
};

const visitStatusConfig: Record<VisitStatus, { label: string; className: string; icon: React.ElementType }> = {
  '待回访': { label: '待回访', className: 'bg-yellow-100 text-yellow-800', icon: Users },
  '回访中': { label: '回访中', className: 'bg-blue-100 text-blue-800', icon: Phone },
  '已完成': { label: '已完成', className: 'bg-green-100 text-green-800', icon: CheckSquare },
  '需再次回访': { label: '需再次回访', className: 'bg-orange-100 text-orange-800', icon: AlertCircle },
};

export function StatusBadge({ status, type = 'refund' }: StatusBadgeProps) {
  const config = type === 'refund' ? refundStatusConfig[status as RefundStatus] : visitStatusConfig[status as VisitStatus];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}
