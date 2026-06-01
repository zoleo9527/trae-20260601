import React from 'react';
import { IssueSeverity } from '../types/inventory';

interface SeverityBadgeProps {
  severity: IssueSeverity;
}

const severityConfig: Record<
  IssueSeverity,
  { label: string; bgColor: string; textColor: string }
> = {
  LOW: {
    label: '轻微',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
  },
  MEDIUM: {
    label: '中等',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
  },
  HIGH: {
    label: '严重',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
  },
  CRITICAL: {
    label: '非常严重',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
  },
};

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity }) => {
  const config = severityConfig[severity];
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-sm ${config.bgColor} ${config.textColor}`}
    >
      {config.label}
    </span>
  );
};
