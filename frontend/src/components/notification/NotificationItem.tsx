import React from 'react';
import { Notification } from '@/types';
import { Card, Button } from '../common';
import { NotificationIcon } from './NotificationIcon';
import { useNotificationStore } from '@/store';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '@/data/mockUsers';
import dayjs from 'dayjs';
import clsx from 'clsx';

interface NotificationItemProps {
  notification: Notification;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
}) => {
  const { markAsRead, executeAction } = useNotificationStore();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const isRead = notification.readBy.includes(currentUser.id);

  const handleAction = async (actionType: string, params?: any) => {
    if (!isRead) {
      await markAsRead(notification.id);
    }

    switch (actionType) {
      case 'VIEW_SCHEDULE':
        if (notification.relatedScheduleId) {
          navigate(`/schedules/${notification.relatedScheduleId}`);
        }
        break;
      case 'VIEW_MATERIAL':
        if (notification.relatedMaterialId) {
          navigate(`/materials/${notification.relatedMaterialId}`);
        }
        break;
      case 'RECONFIRM':
        if (notification.relatedMaterialId) {
          navigate(`/materials/${notification.relatedMaterialId}`);
        }
        break;
      case 'ACKNOWLEDGE':
        if (notification.relatedMaterialId) {
          navigate(`/materials/${notification.relatedMaterialId}`);
        }
        break;
      default:
        break;
    }
  };

  return (
    <Card
      className={clsx(
        'p-4 transition-all',
        !isRead && 'bg-blue-50 border-l-4 border-blue-500'
      )}
    >
      <div className="flex items-start gap-3">
        <NotificationIcon type={notification.type} priority={notification.priority} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={clsx('font-medium', !isRead && 'text-blue-900')}>
              {notification.title}
            </h4>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {dayjs(notification.createdAt).fromNow()}
            </span>
          </div>

          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {notification.content}
          </p>

          <div className="flex items-center gap-2 mt-3">
            {notification.actions.map((action) => (
              <Button
                key={action.type}
                size="sm"
                variant={action.type === 'RECONFIRM' || action.type === 'ACKNOWLEDGE' ? 'primary' : 'secondary'}
                onClick={() => handleAction(action.type, action.params)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
