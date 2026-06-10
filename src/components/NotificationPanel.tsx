import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Bell, Clock, ArrowUp, Settings, Check } from 'lucide-react';
import { api } from '@/lib/api';
import type { Notification } from '@/lib/api';

interface NotificationPanelProps {
  onClose: () => void;
}

const TYPE_ICONS: Record<string, typeof AlertTriangle> = {
  anomaly: AlertTriangle,
  reminder: Clock,
  escalation: ArrowUp,
  system: Settings,
};

const TYPE_COLORS: Record<string, string> = {
  anomaly: 'text-farm-red',
  reminder: 'text-farm-yellow',
  escalation: 'text-farm-orange',
  system: 'text-farm-muted',
};

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.notifications.list().then((res) => {
      setNotifications(res.data || []);
    }).catch(() => setNotifications([]));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleMarkRead = async (id: number) => {
    try {
      await api.notifications.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      // silently handle
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // silently handle
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-12 w-80 bg-farm-darker border border-farm-border rounded-lg shadow-xl z-50"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-farm-border">
        <span className="text-farm-text font-bold text-sm flex items-center gap-2">
          <Bell size={14} />
          通知
          {unreadCount > 0 && (
            <span className="bg-farm-red text-white text-[10px] px-1.5 py-0.5 rounded-full font-mono">
              {unreadCount}
            </span>
          )}
        </span>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-farm-muted text-xs hover:text-farm-text flex items-center gap-1"
          >
            <Check size={12} />
            全部已读
          </button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center text-farm-muted py-6 text-sm">暂无通知</div>
        ) : (
          notifications.map((n) => {
            const Icon = TYPE_ICONS[n.type] || Settings;
            return (
              <div
                key={n.id}
                className={`px-4 py-3 border-b border-farm-border/50 hover:bg-farm-card/50 transition-colors ${
                  !n.read ? 'bg-farm-card/30' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  <Icon size={14} className={`${TYPE_COLORS[n.type]} mt-0.5 shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${n.read ? 'text-farm-muted' : 'text-farm-text font-bold'}`}>
                        {n.title}
                      </span>
                      {!n.read && (
                        <button
                          onClick={() => handleMarkRead(n.id)}
                          className="text-farm-muted hover:text-farm-green shrink-0 ml-2"
                        >
                          <Check size={12} />
                        </button>
                      )}
                    </div>
                    <p className="text-farm-muted text-xs mt-0.5 truncate">{n.content}</p>
                    <span className="text-farm-muted/60 text-[10px] font-mono mt-1 block">
                      {new Date(n.created_at * 1000).toLocaleString('zh-CN')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
