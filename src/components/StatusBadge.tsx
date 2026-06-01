import React from 'react';
import { RoomStatus } from '../types/inventory';

interface StatusBadgeProps {
  status: RoomStatus;
}

const statusConfig: Record<
  RoomStatus,
  { label: string; bgColor: string; textColor: string; borderColor: string }
> = {
  CHECKED_OUT_TODAY: {
    label: '今日退房',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
  },
  PENDING_CLEANING: {
    label: '待保洁',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
  },
  PENDING_REINSPECTION: {
    label: '待复检',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
  },
  DEPOSIT_PENDING: {
    label: '押金待确认',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
  },
  COMPLETED: {
    label: '已完成',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 text-[11px] font-medium rounded-sm border ${config.bgColor} ${config.textColor} ${config.borderColor}`}
    >
      {config.label}
    </span>
  );
};
