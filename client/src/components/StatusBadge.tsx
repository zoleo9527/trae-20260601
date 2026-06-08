import type { ComplaintStatus } from '../types';

interface StatusBadgeProps {
  status: ComplaintStatus;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<ComplaintStatus, { label: string; color: string }> = {
  registered: { label: '已登记', color: 'bg-blue-100 text-blue-700' },
  assigned: { label: '已指派', color: 'bg-purple-100 text-purple-700' },
  processing: { label: '处理中', color: 'bg-amber-100 text-amber-700' },
  compensating: { label: '补偿中', color: 'bg-emerald-100 text-emerald-700' },
  closed: { label: '已关闭', color: 'bg-slate-100 text-slate-600' },
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  return (
    <span className={`inline-block rounded-full font-medium ${config.color} ${sizeClass}`}>
      {config.label}
    </span>
  );
}
