interface StatusBadgeProps {
  status: string;
  type?: 'renewal' | 'communication';
}

export function StatusBadge({ status, type = 'renewal' }: StatusBadgeProps) {
  const configs: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: '待处理' },
    processing: { bg: 'bg-blue-100', text: 'text-blue-700', label: '处理中' },
    completed: { bg: 'bg-green-100', text: 'text-green-700', label: '已完成' },
    risk: { bg: 'bg-red-100', text: 'text-red-700', label: '风险' },
    ongoing: { bg: 'bg-purple-100', text: 'text-purple-700', label: '进行中' },
  };

  const config = configs[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${type === 'renewal' ? '' : ''} ${
        status === 'pending' || status === 'ongoing' ? 'bg-amber-500 animate-pulse' :
        status === 'risk' ? 'bg-red-500' :
        status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
      }`}></span>
      {config.label}
    </span>
  );
}
