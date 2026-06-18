import React from 'react';
import clsx from 'clsx';
import { ScheduleStatus, MaterialStatus } from '@/types';
import { ScheduleStatusConfig } from '@/constants/scheduleStatus';
import { MaterialStatusConfig } from '@/constants/materialStatus';

interface StatusTagProps {
  status: ScheduleStatus | MaterialStatus;
  type?: 'schedule' | 'material';
  size?: 'sm' | 'md';
}

export const StatusTag: React.FC<StatusTagProps> = ({
  status,
  type = 'schedule',
  size = 'md',
}) => {
  const config = type === 'schedule'
    ? ScheduleStatusConfig[status as ScheduleStatus]
    : MaterialStatusConfig[status as MaterialStatus];

  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full font-medium border',
        config.bgColor,
        config.borderColor,
        config.textColor,
        sizeClasses[size]
      )}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};
