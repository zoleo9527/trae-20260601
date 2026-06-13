import { cn } from '@/lib/utils';
import { TimelineLog } from '@/types';
import { format } from 'date-fns';
import {
  Circle,
  CheckCircle2,
  XCircle,
  Clock,
  User,
} from 'lucide-react';

interface TimelineProps {
  logs: TimelineLog[];
  className?: string;
}

const actionIcons: Record<string, React.ReactNode> = {
  '创建培训需求': <Circle className="w-4 h-4 text-gray-400" />,
  '提交审核': <Clock className="w-4 h-4 text-yellow-500" />,
  '审核通过': <CheckCircle2 className="w-4 h-4 text-green-500" />,
  '审核退回': <XCircle className="w-4 h-4 text-red-500" />,
  '创建排期': <Circle className="w-4 h-4 text-blue-400" />,
  '讲师确认排期': <CheckCircle2 className="w-4 h-4 text-green-500" />,
  '讲师拒绝排期': <XCircle className="w-4 h-4 text-red-500" />,
  '部门确认学员名单': <CheckCircle2 className="w-4 h-4 text-green-500" />,
  '部门退回报名': <XCircle className="w-4 h-4 text-red-500" />,
  '重置报名数据': <RotateCcw className="w-4 h-4 text-gray-500" />,
};

function RotateCcw({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 3v5h5"
      />
    </svg>
  );
}

export function Timeline({ logs, className }: TimelineProps) {
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className={cn('space-y-4', className)}>
      {sortedLogs.map((log, index) => (
        <div key={log.id} className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            {actionIcons[log.action] || <Circle className="w-4 h-4 text-gray-400" />}
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-900">
                {log.action}
              </span>
              <span className="text-xs text-gray-500">
                {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <User className="w-3 h-3" />
              <span>{log.operatorName}</span>
              <span className="text-gray-400">·</span>
              <span>
                {log.fromStatus} → {log.toStatus}
              </span>
            </div>
            {log.details && (
              <div className="mt-1 text-xs text-gray-500">
                {log.details.reason && typeof log.details.reason === 'string' && (
                  <p className="italic">原因: {log.details.reason}</p>
                )}
                {log.details.studentCount && typeof log.details.studentCount === 'number' && (
                  <p>学员数量: {log.details.studentCount}</p>
                )}
              </div>
            )}
          </div>
          {index < sortedLogs.length - 1 && (
            <div className="absolute left-6 mt-6 w-0.5 h-4 bg-gray-200" />
          )}
        </div>
      ))}
    </div>
  );
}