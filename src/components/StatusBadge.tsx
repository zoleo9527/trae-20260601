import { cn } from '../lib/utils';

interface StatusBadgeProps {
  status: string;
  type: 'registration' | 'clarification';
}

const registrationStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  reviewing: 'bg-blue-100 text-blue-800 border-blue-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  completed: 'bg-gray-100 text-gray-800 border-gray-200',
};

const clarificationStatusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 border-gray-200',
  pending_review: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  published: 'bg-blue-100 text-blue-800 border-blue-200',
};

const registrationStatusLabels: Record<string, string> = {
  pending: '待处理',
  reviewing: '审核中',
  approved: '已通过',
  rejected: '已退回',
  completed: '已完成',
};

const clarificationStatusLabels: Record<string, string> = {
  draft: '草稿',
  pending_review: '待审核',
  approved: '已通过',
  rejected: '已退回',
  published: '已发布',
};

export default function StatusBadge({ status, type }: StatusBadgeProps) {
  const colors = type === 'registration' ? registrationStatusColors : clarificationStatusColors;
  const labels = type === 'registration' ? registrationStatusLabels : clarificationStatusLabels;

  return (
    <span className={cn(
      'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border',
      colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
    )}>
      {labels[status] || status}
    </span>
  );
}