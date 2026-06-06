import React from 'react';
import { Clock, User } from 'lucide-react';
import { formatDateTime } from '@/utils/date';

export interface TimelineItem {
  id: string;
  action: string;
  operator: string;
  operatorRole?: string;
  remark?: string;
  createdAt: string;
  beforeData?: Record<string, unknown>;
  afterData?: Record<string, unknown>;
}

interface TimelineProps {
  items: TimelineItem[];
  title?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ items, title }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-2 opacity-30" />
        <p>暂无记录</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {title && <h4 className="text-sm font-medium text-gray-700 mb-3">{title}</h4>}
      <div className="relative">
        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200" />
        {items.map((item, index) => (
          <div key={item.id} className="relative pl-10 pb-6 last:pb-0">
            <div
              className={`absolute left-2 w-5 h-5 rounded-full border-2 ${
                index === 0
                  ? 'border-cinema-red bg-white'
                  : 'border-gray-300 bg-white'
              }`}
            />
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{item.action}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {formatDateTime(item.createdAt)}
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                <User className="w-3 h-3" />
                {item.operator}
                {item.operatorRole && <span className="text-gray-400">（{item.operatorRole}）</span>}
              </div>
              {item.remark && <p className="text-sm text-gray-600 bg-white rounded px-3 py-2 border border-gray-100">{item.remark}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
