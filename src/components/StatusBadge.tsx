interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    processing: { label: '处理中', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    review: { label: '审核中', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    approved: { label: '已批准', color: 'bg-green-100 text-green-800 border-green-200' },
    paid: { label: '已赔付', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    archived: { label: '已归档', color: 'bg-gray-100 text-gray-600 border-gray-200' },
    exception: { label: '异常', color: 'bg-red-100 text-red-800 border-red-200' },
  };

  const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-600' };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.color} ${className}`}>
      {config.label}
    </span>
  );
}
