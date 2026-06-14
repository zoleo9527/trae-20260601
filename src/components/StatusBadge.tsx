import React from 'react';
import {
  FEEDBACK_STATUS_LABEL,
  RENEWAL_STATUS_LABEL,
  RISK_LEVEL_LABEL,
  PERFORMANCE_LABEL,
  EXCEPTION_TYPE_LABEL,
  EXCEPTION_STATUS_LABEL,
  EXCEPTION_PRIORITY_LABEL,
  FeedbackStatus,
  RenewalStatus,
  RiskLevel,
  PerformanceLevel,
  ExceptionType,
  ExceptionStatus,
  ExceptionPriority,
} from '@/types';
import { cn } from '@/lib/utils';

type StatusType = 'feedback' | 'renewal' | 'risk' | 'performance' | 'exception' | 'exceptionType' | 'exceptionPriority';

interface StatusBadgeProps {
  type: StatusType;
  value: string;
  className?: string;
}

const feedbackColors: Record<FeedbackStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  processing: 'bg-sky-50 text-sky-700 border-sky-200',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const renewalColors: Record<RenewalStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  contacted: 'bg-sky-50 text-sky-700 border-sky-200',
  negotiating: 'bg-purple-50 text-purple-700 border-purple-200',
  signed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  lost: 'bg-wine-50 text-wine-700 border-wine-200',
};

const riskColors: Record<RiskLevel, string> = {
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-wine-50 text-wine-700 border-wine-200',
};

const performanceColors: Record<PerformanceLevel, string> = {
  excellent: 'bg-gold-50 text-gold-700 border-gold-200',
  good: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  average: 'bg-sky-50 text-sky-700 border-sky-200',
  poor: 'bg-wine-50 text-wine-700 border-wine-200',
};

const exceptionColors: Record<ExceptionStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  processing: 'bg-sky-50 text-sky-700 border-sky-200',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const exceptionTypeColors: Record<ExceptionType, string> = {
  exam: 'bg-purple-50 text-purple-700 border-purple-200',
  costume: 'bg-pink-50 text-pink-700 border-pink-200',
  schedule: 'bg-sky-50 text-sky-700 border-sky-200',
  other: 'bg-ink-50 text-ink-700 border-ink-200',
};

const exceptionPriorityColors: Record<ExceptionPriority, string> = {
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-wine-50 text-wine-700 border-wine-200',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value, className }) => {
  let label = value;
  let colorClass = 'bg-cream-100 text-ink-600 border-cream-300';

  switch (type) {
    case 'feedback':
      label = FEEDBACK_STATUS_LABEL[value as FeedbackStatus] || value;
      colorClass = feedbackColors[value as FeedbackStatus] || colorClass;
      break;
    case 'renewal':
      label = RENEWAL_STATUS_LABEL[value as RenewalStatus] || value;
      colorClass = renewalColors[value as RenewalStatus] || colorClass;
      break;
    case 'risk':
      label = RISK_LEVEL_LABEL[value as RiskLevel] || value;
      colorClass = riskColors[value as RiskLevel] || colorClass;
      break;
    case 'performance':
      label = PERFORMANCE_LABEL[value as PerformanceLevel] || value;
      colorClass = performanceColors[value as PerformanceLevel] || colorClass;
      break;
    case 'exception':
      label = EXCEPTION_STATUS_LABEL[value as ExceptionStatus] || value;
      colorClass = exceptionColors[value as ExceptionStatus] || colorClass;
      break;
    case 'exceptionType':
      label = EXCEPTION_TYPE_LABEL[value as ExceptionType] || value;
      colorClass = exceptionTypeColors[value as ExceptionType] || colorClass;
      break;
    case 'exceptionPriority':
      label = EXCEPTION_PRIORITY_LABEL[value as ExceptionPriority] || value;
      colorClass = exceptionPriorityColors[value as ExceptionPriority] || colorClass;
      break;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
        colorClass,
        className
      )}
    >
      <span className={cn(
        'w-1.5 h-1.5 rounded-full mr-1.5',
        type === 'feedback' && value === 'pending' && 'bg-amber-500 animate-pulse-soft',
        type === 'feedback' && value === 'processing' && 'bg-sky-500 animate-pulse-soft',
        type === 'renewal' && value === 'pending' && 'bg-amber-500 animate-pulse-soft',
        type === 'renewal' && value === 'contacted' && 'bg-sky-500',
        type === 'renewal' && value === 'negotiating' && 'bg-purple-500',
        type === 'risk' && value === 'high' && 'bg-wine-500 animate-pulse-soft',
        type === 'risk' && value === 'medium' && 'bg-amber-500',
        type === 'risk' && value === 'low' && 'bg-emerald-500',
        type === 'exception' && value === 'pending' && 'bg-amber-500 animate-pulse-soft',
        type === 'exception' && value === 'processing' && 'bg-sky-500 animate-pulse-soft',
        type === 'exceptionPriority' && value === 'high' && 'bg-wine-500 animate-pulse-soft',
        type === 'exceptionPriority' && value === 'medium' && 'bg-amber-500',
        type === 'exceptionPriority' && value === 'low' && 'bg-emerald-500',
      )} />
      {label}
    </span>
  );
};
