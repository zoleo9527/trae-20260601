import React from 'react';
import { CheckCircle, Clock, AlertCircle, Circle } from 'lucide-react';
import clsx from 'clsx';

type StatusType = 'pending' | 'in_progress' | 'completed' | 'overdue';

interface StatusTagProps {
  status: StatusType;
  label: string;
  className?: string;
}

const statusConfig = {
  pending: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: Circle,
  },
  in_progress: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
    icon: Clock,
  },
  completed: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200',
    icon: CheckCircle,
  },
  overdue: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: AlertCircle,
  },
};

export const StatusTag: React.FC<StatusTagProps> = ({ status, label, className }) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border',
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </span>
  );
};
