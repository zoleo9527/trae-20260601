import { cn } from '@/lib/utils';
import {
  TrainingNeedStatus,
  ScheduleStatus,
  EnrollmentStatus,
} from '@/types';

interface StatusBadgeProps {
  status: TrainingNeedStatus | ScheduleStatus | EnrollmentStatus | string;
  className?: string;
}

const statusColors: Record<string, string> = {
  '草稿': 'bg-gray-100 text-gray-700',
  '待审核': 'bg-yellow-100 text-yellow-700',
  '已通过': 'bg-green-100 text-green-700',
  '已退回': 'bg-red-100 text-red-700',
  '已排期': 'bg-blue-100 text-blue-700',
  '待排期': 'bg-gray-100 text-gray-700',
  '已确认': 'bg-green-100 text-green-700',
  '讲师拒绝': 'bg-red-100 text-red-700',
  '报名中': 'bg-purple-100 text-purple-700',
  '报名截止': 'bg-orange-100 text-orange-700',
  '培训中': 'bg-blue-100 text-blue-700',
  '已完成': 'bg-green-100 text-green-700',
  '已重置': 'bg-gray-100 text-gray-700',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClass = statusColors[status] || 'bg-gray-100 text-gray-700';

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        colorClass,
        className
      )}
    >
      {status}
    </span>
  );
}
