import { useEffect, useState } from 'react';
import api from '../services/api';
import {
  Bell,
  Mail,
  CheckCircle,
  Clock,
  BookOpen,
  ClipboardCheck,
  AlertTriangle,
  Award,
} from 'lucide-react';
import dayjs from 'dayjs';

interface Notification {
  id: string;
  type: string;
  title: string;
  content?: string;
  channel: string;
  status: string;
  sentAt?: string;
  readAt?: string;
  metadata?: string;
  createdAt: string;
}

export default function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.data.notifications);
      setUnreadCount(response.data.data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      course_reminder: BookOpen,
      attendance_reminder: ClipboardCheck,
      homework_due: Clock,
      exam_reminder: AlertTriangle,
      grade_published: Award,
      exception_processed: CheckCircle,
    };
    return iconMap[type] || Bell;
  };

  const getTypeLabel = (type: string) => {
    const labelMap: Record<string, string> = {
      course_reminder: '课程提醒',
      attendance_reminder: '签到提醒',
      homework_due: '作业截止',
      exam_reminder: '考试提醒',
      grade_published: '成绩发布',
      exception_processed: '异常处理',
    };
    return labelMap[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      course_reminder: 'bg-blue-50 text-blue-600',
      attendance_reminder: 'bg-green-50 text-green-600',
      homework_due: 'bg-yellow-50 text-yellow-600',
      exam_reminder: 'bg-purple-50 text-purple-600',
      grade_published: 'bg-green-50 text-green-600',
      exception_processed: 'bg-orange-50 text-orange-600',
    };
    return colorMap[type] || 'bg-gray-50 text-gray-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">消息通知</h1>
          <p className="mt-1 text-sm text-gray-500">
            {unreadCount > 0 ? `有 ${unreadCount} 条未读消息` : '暂无未读消息'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card text-center py-12">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无通知</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = getTypeIcon(notification.type);
            const isRead = notification.status === 'read';
            return (
              <div
                key={notification.id}
                className={`card hover:shadow-md transition-shadow ${
                  !isRead ? 'bg-primary-50 border-primary-200' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-lg ${getTypeColor(notification.type)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">{notification.title}</span>
                        {!isRead && (
                          <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                        )}
                      </div>
                      <div className="flex items-center text-xs text-gray-500 mb-2">
                        <span className={`badge ${getTypeColor(notification.type)}`}>
                          {getTypeLabel(notification.type)}
                        </span>
                        <span className="ml-2">
                          {notification.sentAt
                            ? dayjs(notification.sentAt).format('YYYY-MM-DD HH:mm')
                            : dayjs(notification.createdAt).format('YYYY-MM-DD HH:mm')}
                        </span>
                      </div>
                      {notification.content && (
                        <p className="text-sm text-gray-600">{notification.content}</p>
                      )}
                    </div>
                  </div>
                  {!isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      标记已读
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
