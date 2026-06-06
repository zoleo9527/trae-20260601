import { StatusLog } from '@/types';
import { formatDateTime, userRoleMap, detentionStatusMap, appealStatusMap } from '@/utils/format';
import { Clock, User } from 'lucide-react';

interface TimelineProps {
  logs: StatusLog[];
  type?: 'detention' | 'appeal';
}

export const Timeline = ({ logs, type = 'detention' }: TimelineProps) => {
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.operateTime).getTime() - new Date(a.operateTime).getTime()
  );

  const getStatusConfig = (status: string) => {
    if (type === 'appeal') {
      return appealStatusMap[status as keyof typeof appealStatusMap] || {
        label: status,
        color: 'bg-gray-100 text-gray-600 border-gray-200',
      };
    }
    return detentionStatusMap[status as keyof typeof detentionStatusMap] || {
      label: status,
      color: 'bg-gray-100 text-gray-600 border-gray-200',
    };
  };

  return (
    <div className="space-y-0">
      {sortedLogs.map((log, index) => {
        const statusConfig = getStatusConfig(log.toStatus);
        return (
          <div key={log.id} className="relative flex gap-4 pb-6 last:pb-0">
            <div className="flex flex-col items-center">
              <div
                className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  index === 0 ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
              {index < sortedLogs.length - 1 && (
                <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${statusConfig.color}`}
                >
                  {statusConfig.label}
                </span>
                {log.fromStatus && log.fromStatus !== log.toStatus && (
                  <span className="text-xs text-gray-400">
                    {getStatusConfig(log.fromStatus).label} → {statusConfig.label}
                  </span>
                )}
              </div>
              {log.remark && (
                <p className="text-sm text-gray-700 mb-2">{log.remark}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {log.operator}
                  <span className="text-gray-400">({userRoleMap[log.operatorRole] || log.operatorRole})</span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDateTime(log.operateTime)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
