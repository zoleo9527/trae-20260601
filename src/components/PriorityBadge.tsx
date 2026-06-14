interface PriorityBadgeProps {
  priority: 'high' | 'medium' | 'low';
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const configs: Record<string, { bg: string; text: string; label: string }> = {
    high: { bg: 'bg-red-100', text: 'text-red-700', label: '高优先级' },
    medium: { bg: 'bg-amber-100', text: 'text-amber-700', label: '中优先级' },
    low: { bg: 'bg-green-100', text: 'text-green-700', label: '低优先级' },
  };

  const config = configs[priority];

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${config.bg} ${config.text}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current"></span>
      {config.label}
    </span>
  );
}
