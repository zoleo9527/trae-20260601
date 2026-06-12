import React from 'react';
import type { WorkOrderStatus } from '../../types';
import { getStatusColor } from '../../lib/utils';

interface StatusTagProps {
  status: WorkOrderStatus;
  size?: 'sm' | 'md';
}

export const StatusTag: React.FC<StatusTagProps> = ({ status, size = 'sm' }) => {
  const baseClasses = 'inline-flex items-center font-medium border rounded-full';
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  
  return (
    <span className={`${baseClasses} ${sizeClasses} ${getStatusColor(status)}`}>
      {status}
    </span>
  );
};
