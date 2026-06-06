import { useStore } from '@/store';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { 
  X, 
  CheckCheck, 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Wrench, 
  User,
  RefreshCw,
  MessageSquare,
  Package,
  Timer,
  FileText
} from 'lucide-react';

interface NotificationPanelProps {
  onClose: () => void;
  onViewOrder?: (orderId: string) => void;
}

export function NotificationPanel({ onClose, onViewOrder }: NotificationPanelProps) {
  const { 
    notifications, 
    currentUser, 
    markNotificationRead, 
    markAllNotificationsRead,
    orders
  } = useStore();

  const userNotifications = notifications.filter(n => 
    !n.relatedUserId || n.relatedUserId === currentUser?.id || n.relatedUserId === currentUser?.role || currentUser?.role === 'logistics_supervisor'
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = userNotifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'rework':
        return <RefreshCw className="w-4 h-4" />;
      case 'completion':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'assignment':
        return <Wrench className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'rework':
        return 'bg-red-100 text-red-600';
      case 'completion':
        return 'bg-green-100 text-green-600';
      case 'assignment':
        return 'bg-blue-100 text-blue-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getOrder = (orderId: string) => {
    return orders.find(o => o.id === orderId);
  };

  const renderNotificationDetail = (notification: any) => {
    const detail = notification.detail;
    if (!detail) return null;

    const isReworkType = notification.type === 'rework';
    const isCompletionType = notification.type === 'completion' || 
      (detail.confirmRemark && !detail.reworkReason);

    if (isReworkType) {
      return (
        <div className="mt-2 text-xs space-y-1.5">
          {detail.reworkReason && (
            <div className="text-red-700 bg-red-50 border border-red-100 rounded-md p-2">
              <span className="font-medium flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1" />
                返修原因：
              </span>
              {detail.reworkReason}
            </div>
          )}
          
          {(detail.originalCompletionDescription || detail.originalConfirmRemark || 
            detail.originalMaterialsUsed || detail.originalLaborHours !== undefined) && (
            <div className="bg-amber-50 border border-amber-100 rounded-md p-2">
              <p className="text-amber-700 font-medium mb-1.5 flex items-center">
                <RefreshCw className="w-3 h-3 mr-1" />
                关联的原完工记录
              </p>
              <div className="space-y-1 text-amber-800">
                {detail.originalCompletionDescription && (
                  <div>
                    <span className="font-medium">维修说明：</span>
                    {detail.originalCompletionDescription}
                  </div>
                )}
                {detail.originalConfirmRemark && (
                  <div className="text-emerald-700 bg-emerald-50/50 rounded p-1.5">
                    <span className="font-medium flex items-center">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      确认备注：
                    </span>
                    {detail.originalConfirmRemark}
                  </div>
                )}
                <div className="flex items-center space-x-3 text-amber-600 pt-1">
                  {detail.originalMaterialsUsed && (
                    <span className="flex items-center">
                      <Package className="w-3 h-3 mr-1" />
                      {detail.originalMaterialsUsed}
                    </span>
                  )}
                  {detail.originalLaborHours !== undefined && (
                    <span className="flex items-center">
                      <Timer className="w-3 h-3 mr-1" />
                      {detail.originalLaborHours} 小时
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (isCompletionType) {
      return (
        <div className="mt-2 text-xs space-y-1.5">
          {detail.confirmRemark && (
            <div className="text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md p-2">
              <span className="font-medium flex items-center">
                <MessageSquare className="w-3 h-3 mr-1" />
                确认备注：
              </span>
              {detail.confirmRemark}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const handleNotificationClick = (notification: any) => {
    markNotificationRead(notification.id);
    if (onViewOrder) {
      onViewOrder(notification.orderId);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose}>
      <div 
        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Bell className="w-5 h-5 text-primary-500" />
            <h3 className="text-lg font-semibold text-gray-900">消息通知</h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
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
                <CheckCheck className="w-3.5 h-3.5" />
                <span>全部已读</span>
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {userNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Bell className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500">暂无通知</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {userNotifications.slice(0, 50).map(notification => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-primary-50/40' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${getIconColor(notification.type)}`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 font-medium">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-primary-500 rounded-full mt-1.5 ml-2 flex-shrink-0" />
                        )}
                      </div>

                      {renderNotificationDetail(notification)}
                      
                      <div className="flex items-center space-x-2 mt-1.5 text-xs text-gray-400">
                        <span>{notification.orderNo}</span>
                        <span>·</span>
                        <span>
                          {format(new Date(notification.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
