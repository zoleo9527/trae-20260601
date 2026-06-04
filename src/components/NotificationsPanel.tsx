import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import type { Notification } from '../types';

interface Props {
  onClose: () => void;
}

export default function NotificationsPanel({ onClose }: Props) {
  const { currentUser, triggerRefresh } = useContext(AppContext);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;
    fetch(`/api/notifications/${currentUser.id}`)
      .then(r => r.json())
      .then(setNotifications);
  }, [currentUser]);

  const handleClick = async (notif: Notification) => {
    await fetch(`/api/notifications/${notif.id}/read`, { method: 'PUT' });
    triggerRefresh();
    onClose();
    if (notif.relatedType === 'FillingSchedule') {
      navigate(`/filling/${notif.relatedId}`);
    } else if (notif.relatedType === 'PackagingRequisition') {
      navigate(`/packaging/${notif.relatedId}`);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'STATUS_CHANGED': return '🔄';
      case 'COMMENT_ADDED': return '💬';
      case 'REJECTED': return '❌';
      case 'APPROVED': return '✅';
      case 'RESUBMITTED': return '📝';
      default: return '📢';
    }
  };

  const formatTime = (time: string) => {
    const date = new Date(time);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  };

  return (
    <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-medium text-gray-900">通知</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-12 text-center text-gray-500">
            <div className="text-3xl mb-2">📭</div>
            暂无通知
          </div>
        ) : (
          notifications.map(notif => (
            <button
              key={notif.id}
              onClick={() => handleClick(notif)}
              className={`w-full px-4 py-3 border-b border-gray-100 hover:bg-gray-50 text-left transition-colors ${
                !notif.read ? 'bg-beer-50/50' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                <span className="text-lg">{getTypeIcon(notif.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <span className={`text-sm ${!notif.read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                      {notif.title}
                    </span>
                    <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                      {formatTime(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                </div>
                {!notif.read && (
                  <span className="w-2 h-2 bg-beer-500 rounded-full flex-shrink-0 mt-1.5" />
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
