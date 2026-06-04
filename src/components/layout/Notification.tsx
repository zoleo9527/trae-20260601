import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';
import { useSurgeryStore } from '@/store/useSurgeryStore';
import { cn } from '@/lib/utils';

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
};

const colors = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
};

const iconColors = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
};

export default function Notification() {
  const { notification, setNotification } = useSurgeryStore();

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification, setNotification]);

  if (!notification) return null;

  const Icon = icons[notification.type];

  return (
    <div className="fixed top-20 right-6 z-50 animate-slide-in">
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg',
          colors[notification.type]
        )}
      >
        <Icon className={cn('w-5 h-5', iconColors[notification.type])} />
        <span className="font-medium">{notification.message}</span>
        <button
          onClick={() => setNotification(null)}
          className="ml-2 p-1 hover:bg-white/50 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
