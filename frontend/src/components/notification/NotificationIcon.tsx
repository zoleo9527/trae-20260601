import React from 'react';
import { Notification } from '@/types';
import { Bell, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import clsx from 'clsx';

interface NotificationIconProps {
  type: Notification['type'];
  priority: Notification['priority'];
}

export const NotificationIcon: React.FC<NotificationIconProps> = ({
  type,
  priority,
}) => {
  const getIcon = () => {
    if (priority === 'HIGH' || priority === 'URGENT') {
      return <AlertTriangle className="w-5 h-5" />;
    }
    if (type.includes('MATERIAL_READY') || type.includes('SCHEDULE_APPROVED')) {
      return <CheckCircle className="w-5 h-5" />;
    }
    return <Info className="w-5 h-5" />;
  };

  const getColor = () => {
    if (priority === 'URGENT') return 'text-red-600 bg-red-100';
    if (priority === 'HIGH') return 'text-orange-600 bg-orange-100';
    if (priority === 'MEDIUM') return 'text-blue-600 bg-blue-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <div className={clsx('w-10 h-10 rounded-full flex items-center justify-center', getColor())}>
      {getIcon()}
    </div>
  );
};
