import React from 'react';
import { Clock } from 'lucide-react';
import type { OperationLog } from '@/types';

interface TimelineItem {
  id: string;
  title: string;
  time: string;
  operator?: string;
  description?: string;
  remark?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
}

interface TimelineProps {
  logs?: OperationLog[];
  items?: TimelineItem[];
}

export const Timeline: React.FC<TimelineProps> = ({ logs, items }) => {
  const displayItems: TimelineItem[] = logs
    ? logs.map(log => ({
        id: log.id,
        title: log.operation,
        time: new Date(log.operateAt).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        operator: log.operatorName,
        description: log.detail,
        remark: log.remark,
      }))
    : items || [];

  if (displayItems.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        暂无操作记录
      </div>
    );
  }

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    gray: 'bg-gray-400',
  };

  return (
    <div className="relative">
      {displayItems.map((item, index) => (
        <div key={item.id} className="relative flex gap-4 pb-8">
          {index < displayItems.length - 1 && (
            <div className="absolute left-[11px] top-6 w-0.5 h-full bg-gray-200" />
          )}
          <div className="relative z-10 flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
            <div className={`w-3 h-3 rounded-full ${colorMap[item.color || 'blue']}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-900">{item.title}</span>
              {item.operator && (
                <span className="text-gray-500 text-sm">by {item.operator}</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-gray-500 text-sm mb-2">
              <Clock className="w-3 h-3" />
              <span>{item.time}</span>
            </div>
            {item.description && (
              <div className="text-gray-700 text-sm mb-1">{item.description}</div>
            )}
            {item.remark && (
              <div className="text-gray-500 text-sm italic">备注：{item.remark}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
