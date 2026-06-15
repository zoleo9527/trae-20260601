import { cn } from '@/lib/utils';
import { UserRole } from '@/types';
import { roleMap } from '@/utils/status';
import { formatDateTime } from '@/utils/date';
import { CheckCircle, Clock, AlertTriangle, Wrench, ClipboardCheck, User, Truck } from 'lucide-react';

interface TimelineItem {
  id: string;
  role: UserRole;
  handler: string;
  action: string;
  remark?: string;
  timestamp: string;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const roleIcons: Record<UserRole, React.ReactNode> = {
  manager: <User size={14} />,
  dispatcher: <Truck size={14} />,
  technician: <Wrench size={14} />,
  driver: <ClipboardCheck size={14} />,
};

const roleColors: Record<UserRole, string> = {
  manager: 'bg-slate-500',
  dispatcher: 'bg-blue-500',
  technician: 'bg-amber-500',
  driver: 'bg-emerald-500',
};

export function Timeline({ items, className }: TimelineProps) {
  const sortedItems = [...items].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className={cn('relative', className)}>
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-200" />
      <div className="space-y-5">
        {sortedItems.map((item, index) => (
          <div key={item.id} className="relative flex gap-4 pl-7">
            <div
              className={cn(
                'absolute left-0 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-white',
                roleColors[item.role]
              )}
            >
              {roleIcons[item.role]}
            </div>
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-slate-900 text-sm">{item.action}</span>
                <span className="text-xs text-slate-500">
                  {roleMap[item.role].label} · {item.handler}
                </span>
              </div>
              {item.remark && (
                <p className="text-sm text-slate-600 mb-1">{item.remark}</p>
              )}
              <p className="text-xs text-slate-400">{formatDateTime(item.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
