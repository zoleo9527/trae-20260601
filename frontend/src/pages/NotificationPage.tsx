import React from 'react';
import { Bell } from 'lucide-react';
import { Card, Button } from '@/components/common';
import { NotificationItem } from '@/components/notification';
import { useNotificationStore } from '@/store';
import { getCurrentUser } from '@/data/mockUsers';

export const NotificationPage: React.FC = () => {
  const { notifications, unreadCount, fetchNotifications, batchMarkAsRead, isLoading } =
    useNotificationStore();
  const currentUser = getCurrentUser();

  React.useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadNotifications = notifications.filter((n) => !n.readBy.includes(currentUser.id));
  const readNotifications = notifications.filter((n) => n.readBy.includes(currentUser.id));

  const handleMarkAllAsRead = () => {
    const ids = unreadNotifications.map((n) => n.id);
    batchMarkAsRead(ids);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">消息中心</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? `您有 ${unreadCount} 条未读消息` : '暂无未读消息'}
          </p>
        </div>
        {unreadNotifications.length > 0 && (
          <Button variant="secondary" onClick={handleMarkAllAsRead}>
            全部标为已读
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="p-4 space-y-3">
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
              </div>
            </Card>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card className="text-center py-12">
          <Bell className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">暂无消息</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {unreadNotifications.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                未读消息 ({unreadNotifications.length})
              </h2>
              <div className="space-y-4">
                {unreadNotifications.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))}
              </div>
            </div>
          )}

          {readNotifications.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                已读消息 ({readNotifications.length})
              </h2>
              <div className="space-y-4">
                {readNotifications.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
