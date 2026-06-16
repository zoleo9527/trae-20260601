import React from 'react';
import { getStatusColor } from '../utils/helpers';

interface StatusBadgeProps {
  status: string;
  label: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current"></span>
      {label}
    </span>
  );
};

export default StatusBadge;