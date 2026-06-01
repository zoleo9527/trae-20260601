import React from 'react';
import { OperationLog } from '../types/inventory';
import { Clock, User } from 'lucide-react';

interface TimelineProps {
  logs: OperationLog[];
}

export const Timeline: React.FC<TimelineProps> = ({ logs }) => {
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
  );

  return (
    <div className="space-y-2">
      {sortedLogs.map((log, index) => (
        <div key={log.id} className="flex gap-2">
          <div className="flex flex-col items-center">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                index === 0 ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            />
            {index < sortedLogs.length - 1 && (
              <div className="w-px h-full bg-gray-200 mt-0.5" />
            )}
          </div>
          <div className="flex-1 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-gray-800">{log.action}</span>
              <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />
                {log.time}
              </span>
            </div>
            <div className="flex items-center gap-0.5 mt-0.5 text-[10px] text-gray-500">
              <User className="w-2.5 h-2.5" />
              <span>{log.operator}</span>
            </div>
            {log.remark && (
              <p className="text-[11px] text-gray-600 mt-0.5 bg-gray-50 px-1.5 py-0.5 rounded-sm">
                {log.remark}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
