import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, CheckCheck, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../services/api';

const NotificationList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    if (!user) return;
    setLoading(true);
    notificationAPI.list({ userId: user.id }).then(data => {
      setNotifications(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    await notificationAPI.markAllRead(user.id);
    fetchData();
  };

  const markRead = async (id: string) => {
    await notificationAPI.markRead(id);
    fetchData();
  };

  const getTypeConfig = (type: string) => {
    const configs: Record<string, { label: string; color: string; icon: any }> = {
      INSPECTION_RETURNED: { label: '巡检退回', color: 'bg-red-100 text-red-700', icon: Bell },
      INSPECTION_SUPPLEMENT: { label: '巡检补录', color: 'bg-amber-100 text-amber-700', icon: Bell },
      INSPECTION_REVIEWED: { label: '巡检复核', color: 'bg-green-100 text-green-700', icon: Bell },
      REPAIR_CREATED: { label: '工单创建', color: 'bg-blue-100 text-blue-700', icon: Bell },
      REPAIR_ASSIGNED: { label: '工单指派', color: 'bg-purple-100 text-purple-700', icon: Bell },
      REPAIR_COMPLETED: { label: '工单完成', color: 'bg-cyan-100 text-cyan-700', icon: Bell },
      REPAIR_RETURNED: { label: '工单退回', color: 'bg-red-100 text-red-700', icon: Bell },
      REPAIR_REVIEWED: { label: '工单复核', color: 'bg-green-100 text-green-700', icon: Bell }
    };
    return configs[type] || { label: type, color: 'bg-gray-100 text-gray-700', icon: Bell };
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">通知中心</h2>
          <p className="text-sm text-gray-500">您有 {unreadCount} 条未读通知</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn btn-secondary text-sm">
            <CheckCheck size={16} className="mr-1.5" /> 全部标为已读
          </button>
        )}
      </div>

      <div className="card p-0 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Bell size={48} className="mx-auto mb-3 text-gray-300" />
            <p>暂无通知</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map(n => {
              const typeConfig = getTypeConfig(n.type);
              const TypeIcon = typeConfig.icon;
              const handleClick = () => {
                if (!n.read) markRead(n.id);
                if (n.type.includes('INSPECTION') && n.relatedId) {
                  navigate(`/inspections/${n.relatedId}`);
                } else if (n.type.includes('REPAIR') && n.relatedId) {
                  navigate(`/repairs/${n.relatedId}`);
                }
              };
              return (
                <div
                  key={n.id}
                  onClick={handleClick}
                  className={`p-4 cursor-pointer transition-colors ${
                    n.read ? 'bg-white hover:bg-gray-50' : 'bg-blue-50 hover:bg-blue-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${typeConfig.color}`}>
                      <TypeIcon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${n.read ? 'text-gray-700' : 'text-gray-900'}`}>
                          {n.title}
                        </p>
                        {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{n.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(n.createdAt).toLocaleString('zh-CN')}
                        </span>
                        {n.relatedId && (
                          <span className="text-xs text-primary-600 flex items-center gap-1">
                            查看详情 <ArrowRight size={12} />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationList;
