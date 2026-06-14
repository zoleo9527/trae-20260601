
import { cn } from '../../utils/helpers';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

const statusConfig: Record<string, { bg: string; text: string; pulse?: boolean }> = {
  '已完成': { bg: 'bg-green-500', text: 'text-white' },
  '待检测': { bg: 'bg-blue-100', text: 'text-blue-700 border border-blue-300' },
  '检测中': { bg: 'bg-blue-500', text: 'text-white' },
  '待审核': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  '待发放': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  '发放中': { bg: 'bg-inspector', text: 'text-white' },
  '已发放': { bg: 'bg-auditor', text: 'text-white' },
  '待执行': { bg: 'bg-blue-100', text: 'text-blue-700' },
  '进行中': { bg: 'bg-blue-500', text: 'text-white' },
  '已驳回': { bg: 'bg-red-500', text: 'text-white' },
  '已通过': { bg: 'bg-green-500', text: 'text-white' },
  '待回访': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  '回访中': { bg: 'bg-auditor', text: 'text-white' },
  '无法联系': { bg: 'bg-gray-500', text: 'text-white' },
  '发放异常': { bg: 'bg-red-500', text: 'text-white' },
  '补录': { bg: 'bg-blue-100 border-dashed border-2 border-blue-500', text: 'text-blue-700' },
  '拖延': { bg: 'bg-orange-100 border-2 border-orange-500', text: 'text-orange-700', pulse: true },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export function StatusBadge({ status, size = 'md', pulse = false, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-700' };
  const shouldPulse = pulse || config.pulse;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        config.bg,
        config.text,
        sizeClasses[size],
        className
      )}
      style={shouldPulse ? { animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' } : undefined}
    >
      {status}
    </span>
  );
}
