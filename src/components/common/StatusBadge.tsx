import React from 'react';
import {
  ANOMALY_TYPE_LABELS,
  ANOMALY_TYPE_COLORS,
  ANOMALY_STATUS_LABELS,
  AnomalyType,
  AnomalyStatus,
} from '@/types';

interface StatusBadgeProps {
  type: AnomalyType;
  status?: AnomalyStatus;
  showStatus?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  type,
  status,
  showStatus = false,
}) => {
  const bgColor = ANOMALY_TYPE_COLORS[type];
  const label = ANOMALY_TYPE_LABELS[type];

  const statusColor =
    status === 'pending'
      ? 'bg-yellow-100 text-yellow-800'
      : status === 'processing'
      ? 'bg-blue-100 text-blue-800'
      : 'bg-green-100 text-green-800';

  return (
    <div className="flex items-center gap-2">
      <span
        className={`${bgColor} text-white text-xs px-2 py-1 rounded font-medium`}
      >
        {label}
      </span>
      {showStatus && status && (
        <span
          className={`${statusColor} text-xs px-2 py-1 rounded font-medium`}
        >
          {ANOMALY_STATUS_LABELS[status]}
        </span>
      )}
    </div>
  );
};
