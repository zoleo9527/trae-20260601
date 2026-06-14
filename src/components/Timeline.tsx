import React from 'react';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/utils/date';
import { Avatar } from './Avatar';
import { MessageSquare, RefreshCw, User, Settings, AlertTriangle } from 'lucide-react';
import { LogType } from '@/types';

interface TimelineItem {
  id: string;
  type: LogType;
  targetId?: string;
  targetName: string;
  action: string;
  operator: string;
  timestamp: string;
  details: string;
  onClick?: () => void;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const typeIcons: Record<LogType, React.ReactNode> = {
  feedback: <MessageSquare className="w-4 h-4" />,
  renewal: <RefreshCw className="w-4 h-4" />,
  student: <User className="w-4 h-4" />,
  exception: <AlertTriangle className="w-4 h-4" />,
  system: <Settings className="w-4 h-4" />,
};

const typeColors: Record<LogType, string> = {
  feedback: 'bg-sky-100 text-sky-600',
  renewal: 'bg-gold-100 text-gold-600',
  student: 'bg-emerald-100 text-emerald-600',
  exception: 'bg-rose-100 text-rose-600',
  system: 'bg-ink-100 text-ink-600',
};

export const Timeline: React.FC<TimelineProps> = ({ items, className }) => {
  return (
    <div className={cn('space-y-0', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={item.id} className="relative pl-8 pb-5 last:pb-0">
            {/* 时间线 */}
            {!isLast && (
              <div className="absolute left-[15px] top-7 bottom-0 w-px bg-cream-200" />
            )}
            
            {/* 图标圆点 */}
            <div className={cn(
              'absolute left-0 top-0.5 w-8 h-8 rounded-full flex items-center justify-center',
              typeColors[item.type]
            )}>
              {typeIcons[item.type]}
            </div>

            {/* 内容 */}
            <div
              className={cn(
                'cursor-pointer transition-colors rounded-lg -mx-2 px-2 py-1',
                item.onClick && 'hover:bg-cream-50'
              )}
              onClick={item.onClick}
            >
              <div className="flex items-start gap-2">
                <span className="font-medium text-ink-800 text-sm">
                  {item.operator}
                </span>
                <span className="text-ink-500 text-sm">
                  {item.action}
                </span>
                <span className="text-ink-700 font-medium text-sm">
                  {item.targetName}
                </span>
              </div>
              <p className="text-sm text-ink-500 mt-0.5 line-clamp-2">
                {item.details}
              </p>
              <p className="text-xs text-ink-400 mt-1">
                {formatRelativeTime(item.timestamp)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
