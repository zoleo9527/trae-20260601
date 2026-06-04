import { CheckCircle2, Clock, Circle } from 'lucide-react';
import { STATUS_LABELS, ROLE_LABELS } from '../../shared/types';
import type { StatusLog } from '../../shared/types';
import { formatDateTime } from '../utils/format';
import { cn } from '../lib/utils';

interface StatusTimelineProps {
  logs: StatusLog[];
}

const statusOrder = [
  'PENDING_REVIEW',
  'REVIEWED',
  'PENDING_DECOCTION',
  'DECOCTED',
  'PENDING_DELIVERY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'RETURNED',
  'COMPLETED',
];

export function StatusTimeline({ logs }: StatusTimelineProps) {
  const completedStatuses = logs.map((log) => log.toStatus);
  const lastStatus = logs[logs.length - 1]?.toStatus;

  return (
    <div className="relative">
      <div className="absolute left-[11px] top-0 bottom-0 w-px bg-slate-200" />
      <div className="space-y-6">
        {statusOrder.map((status, index) => {
          const log = logs.find((l) => l.toStatus === status);
          const isCompleted = completedStatuses.includes(status as any);
          const isCurrent = lastStatus === status;

          if (status === 'RETURNED' && lastStatus !== 'RETURNED') {
            return null;
          }

          return (
            <div key={status} className="relative flex items-start gap-4 pl-8">
              <div
                className={cn(
                  'absolute left-0 top-0 flex items-center justify-center w-6 h-6 rounded-full border-2',
                  isCompleted
                    ? 'bg-teal-600 border-teal-600 text-white'
                    : 'bg-white border-slate-300 text-slate-400'
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : isCurrent ? (
                  <Clock className="w-3 h-3 text-amber-500" />
                ) : (
                  <Circle className="w-3 h-3" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'font-medium text-sm',
                      isCompleted ? 'text-slate-900' : 'text-slate-400'
                    )}
                  >
                    {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
                  </span>
                  {isCurrent && (
                    <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">
                      当前
                    </span>
                  )}
                </div>
                {log ? (
                  <div className="mt-1 space-y-1">
                    <p className="text-sm text-slate-600">{log.remark}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{ROLE_LABELS[log.operatorRole]}</span>
                      <span>·</span>
                      <span>{log.operatorName}</span>
                      <span>·</span>
                      <span>{formatDateTime(log.createdAt)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-slate-400">等待处理</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
