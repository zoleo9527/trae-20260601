import { useStore } from '@/store';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { X, CheckCheck, Bell } from 'lucide-react';

interface NotificationPanelProps {
  onClose: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { notifications, currentUser, markNotificationRead, markAllNotificationsRead } = useStore();
  
  const userNotifications = notifications.filter(n => 
    n.relatedUserId === currentUser?.id || !n.relatedUserId
  );

  const unreadCount = userNotifications.filter(n => !n.read).length;

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[500px] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <Bell className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-gray-900">通知</span>
          {unreadCount > 0 && (
            <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
              {unreadCount} 条未读
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllNotificationsRead}
              className="text-xs text-primary-600 hover:text-primary-700 flex items-center space-x-1"
            >
              <CheckCheck className="w-3 h-3" />
              <span>全部已读</span>
            </button>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {userNotifications.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">暂无通知</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {userNotifications.slice(0, 20).map(notification => (
              <div
                key={notification.id}
                onClick={() => markNotificationRead(notification.id)}
                className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                  !notification.read ? 'bg-primary-50/50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm text-gray-900 flex-1">{notification.message}</p>
                  {!notification.read && (
                    <span className="w-2 h-2 bg-primary-500 rounded-full mt-1.5 ml-2 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {format(new Date(notification.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
