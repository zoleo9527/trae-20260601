import type { Severity } from '../types';

interface SeverityBadgeProps {
  severity: Severity;
  size?: 'sm' | 'md';
}

const SEVERITY_CONFIG: Record<Severity, { label: string; color: string }> = {
  low: { label: '一般', color: 'bg-green-100 text-green-700' },
  medium: { label: '中等', color: 'bg-blue-100 text-blue-700' },
  high: { label: '紧急', color: 'bg-orange-100 text-orange-700' },
  urgent: { label: '特急', color: 'bg-red-100 text-red-700' },
};

export default function SeverityBadge({ severity, size = 'sm' }: SeverityBadgeProps) {
  const config = SEVERITY_CONFIG[severity];
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  return (
    <span className={`inline-block rounded-full font-medium ${config.color} ${sizeClass}`}>
      {config.label}
    </span>
  );
}
