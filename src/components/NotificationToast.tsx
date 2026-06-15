import { useAppStore } from '../store';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function NotificationToast() {
  const notificationMessages = useAppStore((state) => state.notificationMessages);
  const removeNotification = useAppStore((state) => state.removeNotification);

  if (notificationMessages.length === 0) return null;

  const getIcon = (message: string) => {
    if (message.includes('成功') || message.includes('同步')) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (message.includes('异常') || message.includes('错误')) {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
    return <Info className="w-5 h-5 text-blue-500" />;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {notificationMessages.map((message, index) => (
        <div
          key={index}
          className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-100 min-w-[280px] animate-slide-in"
        >
          {getIcon(message)}
          <span className="flex-1 text-sm text-gray-700">{message}</span>
          <button
            onClick={() => removeNotification(index)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      ))}
    </div>
  );
}
