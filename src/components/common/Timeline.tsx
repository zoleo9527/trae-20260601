import React from 'react';
import { Circle, CheckCircle, AlertCircle } from 'lucide-react';
import { TimelineLog, ROLE_LABELS } from '@/types';
import { formatDateTime } from '@/utils/dateUtils';

interface TimelineProps {
  logs: TimelineLog[];
}

export const Timeline: React.FC<TimelineProps> = ({ logs }) => {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'manager':
        return 'bg-purple-500';
      case 'dispatcher':
        return 'bg-blue-500';
      case 'repairer':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('通过') || action.includes('完成')) {
      return <CheckCircle size={16} className="text-green-500" />;
    }
    if (action.includes('不通过') || action.includes('争议') || action.includes('异常')) {
      return <AlertCircle size={16} className="text-red-500" />;
    }
    return <Circle size={16} className="text-gray-400" />;
  };

  return (
    <div className="relative">
      {logs.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">暂无操作记录</p>
      ) : (
        <div className="space-y-0">
          {logs.map((log, index) => (
            <div key={log.id} className="relative flex gap-4 pb-6 last:pb-0">
              <div className="flex flex-col items-center">
                <div
                  className={`w-3 h-3 rounded-full ${getRoleColor(log.role)} flex-shrink-0 z-10`}
                />
                {index < logs.length - 1 && (
                  <div className="w-0.5 bg-gray-200 flex-1 mt-1" />
                )}
              </div>
              <div className="flex-1 pb-1">
                <div className="flex items-start gap-2 mb-1">
                  {getActionIcon(log.action)}
                  <span className="font-medium text-gray-800 text-sm">
                    {log.action}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded text-white ${getRoleColor(
                      log.role
                    )}`}
                  >
                    {ROLE_LABELS[log.role]}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-1">
                  {log.operator} · {formatDateTime(log.timestamp)}
                </p>
                {log.remark && (
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {log.remark}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
