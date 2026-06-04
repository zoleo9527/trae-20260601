import { useAppStore } from '@/store/useAppStore';
import { Bell, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';

export default function NotificationBell() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAppStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const unread = notifications.filter((n) => !n.read);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const typeColors: Record<string, string> = {
    anomaly: 'border-l-red-500 bg-red-50',
    return: 'border-l-amber-500 bg-amber-50',
    level_change: 'border-l-sky-500 bg-sky-50',
    task: 'border-l-emerald-500 bg-emerald-50',
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <Bell size={18} className="text-slate-500" />
        {unread.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
            {unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-lg shadow-xl border border-slate-200 z-50 max-h-96 flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-700">通知 ({unread.length} 未读)</span>
            {unread.length > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="text-[10px] text-sky-600 hover:text-sky-700"
              >
                全部已读
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {notifications.slice(0, 20).map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  markNotificationRead(n.id);
                  if (n.relatedType === 'nursing_level') navigate('/nursing-levels');
                  else if (n.relatedType === 'bed') navigate('/beds');
                  setOpen(false);
                }}
                className={cn(
                  'border-l-[3px] px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors',
                  typeColors[n.type] || 'border-l-slate-300',
                  !n.read && 'bg-slate-50/50'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={cn('text-xs', !n.read ? 'font-semibold text-slate-800' : 'text-slate-600')}>
                      {n.title}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">{n.description}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(n.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
