import React from 'react';
import {
  PREPARATION_STATUS_MAP,
  INVENTORY_LOCK_STATUS_MAP,
  CUSTOMS_STATUS_MAP,
  type PreparationOrderStatus,
  type InventoryLockStatus,
  type CustomsDocStatus,
} from '@/types';

interface StatusBadgeProps {
  status: string;
  type: 'preparation' | 'inventory' | 'customs';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type }) => {
  const getStatusConfig = () => {
    switch (type) {
      case 'preparation':
        return PREPARATION_STATUS_MAP[status as PreparationOrderStatus];
      case 'inventory':
        return INVENTORY_LOCK_STATUS_MAP[status as InventoryLockStatus];
      case 'customs':
        return CUSTOMS_STATUS_MAP[status as CustomsDocStatus];
      default:
        return { label: status, color: 'bg-gray-100 text-gray-700' };
    }
  };

  const config = getStatusConfig() || { label: status, color: 'bg-gray-100 text-gray-700' };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};
