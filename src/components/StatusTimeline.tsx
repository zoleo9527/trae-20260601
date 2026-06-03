import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ScanLine,
  Wrench,
  Package,
  Factory,
  Search,
  RotateCcw,
} from 'lucide-react';
import type { AuditLog, OrderStatus } from '@/types';
import { STATUS_LABELS, ROLE_LABELS } from '@/types';
import { cn } from '@/lib/utils';

interface TimelineEvent {
  id: string;
  status: OrderStatus;
  action: string;
  operator: string;
  role: string;
  timestamp: string;
  detail: string;
  isCurrent: boolean;
}

interface StatusTimelineProps {
  logs: AuditLog[];
  currentStatus: OrderStatus;
  className?: string;
}

const STATUS_ORDER: OrderStatus[] = [
  'PENDING',
  'SCAN_UPLOADED',
  'PROCESSING',
  'ASSIGNED',
  'IN_PRODUCTION',
  'PENDING_INSPECTION',
  'COMPLETED',
  'REWORK',
];

const STATUS_ICONS: Record<OrderStatus, React.ReactNode> = {
  PENDING: <FileText size={16} />,
  SCAN_UPLOADED: <ScanLine size={16} />,
  PROCESSING: <Wrench size={16} />,
  ASSIGNED: <Package size={16} />,
  IN_PRODUCTION: <Factory size={16} />,
  PENDING_INSPECTION: <Search size={16} />,
  COMPLETED: <CheckCircle2 size={16} />,
  REWORK: <RotateCcw size={16} />,
};

const STATUS_COLORS: Record<OrderStatus, { dot: string; line: string; bg: string; text: string }> = {
  PENDING: {
    dot: 'bg-warning-400',
    line: 'bg-warning-200',
    bg: 'bg-warning-50',
    text: 'text-warning-700',
  },
  SCAN_UPLOADED: {
    dot: 'bg-primary-400',
    line: 'bg-primary-200',
    bg: 'bg-primary-50',
    text: 'text-primary-700',
  },
  PROCESSING: {
    dot: 'bg-primary-500',
    line: 'bg-primary-200',
    bg: 'bg-primary-50',
    text: 'text-primary-700',
  },
  ASSIGNED: {
    dot: 'bg-primary-600',
    line: 'bg-primary-200',
    bg: 'bg-primary-50',
    text: 'text-primary-700',
  },
  IN_PRODUCTION: {
    dot: 'bg-warning-500',
    line: 'bg-warning-200',
    bg: 'bg-warning-50',
    text: 'text-warning-700',
  },
  PENDING_INSPECTION: {
    dot: 'bg-warning-600',
    line: 'bg-warning-200',
    bg: 'bg-warning-50',
    text: 'text-warning-700',
  },
  COMPLETED: {
    dot: 'bg-success-500',
    line: 'bg-success-200',
    bg: 'bg-success-50',
    text: 'text-success-700',
  },
  REWORK: {
    dot: 'bg-danger-500',
    line: 'bg-danger-200',
    bg: 'bg-danger-50',
    text: 'text-danger-700',
  },
};

export function StatusTimeline({ logs, currentStatus, className }: StatusTimelineProps) {
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFullDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const buildTimelineEvents = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    const seenStatuses = new Set<OrderStatus>();

    const sortedLogs = [...logs].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    for (const log of sortedLogs) {
      if (log.newStatus && !seenStatuses.has(log.newStatus)) {
        seenStatuses.add(log.newStatus);
        events.push({
          id: log.id,
          status: log.newStatus,
          action: log.action,
          operator: log.operator,
          role: ROLE_LABELS[log.role],
          timestamp: log.createdAt,
          detail: log.detail,
          isCurrent: log.newStatus === currentStatus,
        });
      }
    }

    const currentIndex = STATUS_ORDER.indexOf(currentStatus);
    if (currentStatus === 'REWORK') {
      const reworkLog = sortedLogs.find((l) => l.newStatus === 'REWORK');
      if (reworkLog && !events.find((e) => e.status === 'REWORK')) {
        events.push({
          id: reworkLog.id,
          status: 'REWORK',
          action: reworkLog.action,
          operator: reworkLog.operator,
          role: ROLE_LABELS[reworkLog.role],
          timestamp: reworkLog.createdAt,
          detail: reworkLog.detail,
          isCurrent: true,
        });
      }
    }

    return events.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  };

  const events = buildTimelineEvents();
  const currentStatusIndex = STATUS_ORDER.indexOf(currentStatus);

  const getExpectedDuration = (status: OrderStatus): string => {
    const durations: Partial<Record<OrderStatus, string>> = {
      PENDING: '预计 24 小时内',
      SCAN_UPLOADED: '预计 2 小时内',
      PROCESSING: '预计 4 小时内',
      ASSIGNED: '预计 2 小时内',
      IN_PRODUCTION: '预计 1-3 天',
      PENDING_INSPECTION: '预计 4 小时内',
      COMPLETED: '已完成',
      REWORK: '返工处理中',
    };
    return durations[status] || '';
  };

  return (
    <div className={cn('bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden', className)}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-neutral-200 bg-gradient-to-r from-primary-50 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-neutral-800">订单状态流转</h3>
            <p className="text-xs text-neutral-500 mt-0.5">当前状态：{STATUS_LABELS[currentStatus]}</p>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-neutral-400" />
            <span className="text-sm text-neutral-500">共 {events.length} 个节点</span>
          </div>
        </div>
      </div>

      {/* Status Overview Bar */}
      <div className="px-5 py-4 bg-neutral-50 border-b border-neutral-100">
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {STATUS_ORDER.slice(0, 7).map((status, index) => {
            const isCompleted = STATUS_ORDER.indexOf(currentStatus) > index;
            const isCurrent = currentStatus === status;
            const isPending = !isCompleted && !isCurrent;
            const colors = STATUS_COLORS[status];

            return (
              <div key={status} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300',
                      isCurrent && 'ring-4 ring-offset-2',
                      isCompleted
                        ? `${colors.dot} text-white ring-${colors.dot.replace('bg-', '')}`
                        : isCurrent
                        ? `${colors.dot} text-white ring-${colors.dot.replace('bg-', '')}/30`
                        : 'bg-neutral-200 text-neutral-400'
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      STATUS_ICONS[status] || <AlertCircle size={16} />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-xs mt-1.5 whitespace-nowrap font-medium',
                      isCurrent ? colors.text : isCompleted ? 'text-neutral-600' : 'text-neutral-400'
                    )}
                  >
                    {STATUS_LABELS[status]}
                  </span>
                </div>
                {index < 6 && (
                  <div
                    className={cn(
                      'w-12 h-0.5 mx-1 mb-5 transition-all duration-500',
                      isCompleted ? colors.line : 'bg-neutral-200'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Timeline */}
      <div className="px-5 py-4">
        <h4 className="text-sm font-medium text-neutral-700 mb-4">流转详情</h4>
        <div className="space-y-0">
          {events.map((event, index) => {
            const colors = STATUS_COLORS[event.status];
            const isLast = index === events.length - 1;
            const isRework = event.status === 'REWORK';

            return (
              <div key={event.id} className="relative">
                {/* Timeline Line */}
                {!isLast && (
                  <div
                    className={cn(
                      'absolute left-[15px] top-8 bottom-0 w-0.5',
                      isRework ? 'bg-danger-200' : colors.line
                    )}
                  />
                )}

                {/* Timeline Item */}
                <div
                  className={cn(
                    'relative pl-10 pb-6 group',
                    event.isCurrent && 'animate-fade-in'
                  )}
                >
                  {/* Timeline Dot */}
                  <div
                    className={cn(
                      'absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 z-10',
                      colors.dot,
                      'text-white shadow-md',
                      event.isCurrent && 'ring-4 ring-offset-2',
                      event.isCurrent &&
                        `${isRework ? 'ring-danger-200' : `ring-${colors.dot.replace('bg-', '')}/30`}`
                    )}
                  >
                    {STATUS_ICONS[event.status] || <Clock size={14} />}
                  </div>

                  {/* Content Card */}
                  <div
                    className={cn(
                      'rounded-lg p-4 border transition-all duration-200',
                      event.isCurrent
                        ? `${colors.bg} ${colors.text} border-2`
                        : 'bg-neutral-50 border-neutral-100 hover:border-neutral-200'
                    )}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'font-semibold',
                              event.isCurrent ? colors.text : 'text-neutral-800'
                            )}
                          >
                            {STATUS_LABELS[event.status]}
                          </span>
                          {event.isCurrent && (
                            <span className="px-2 py-0.5 bg-white/80 text-xs rounded-full font-medium text-neutral-600">
                              当前
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-500 mt-1">{event.action}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p
                          className={cn(
                            'text-sm font-medium',
                            event.isCurrent ? colors.text : 'text-neutral-700'
                          )}
                        >
                          {formatDateTime(event.timestamp)}
                        </p>
                        <p className="text-xs text-neutral-400">
                          {formatFullDateTime(event.timestamp)}
                        </p>
                      </div>
                    </div>

                    {/* Detail */}
                    <p
                      className={cn(
                        'text-sm mt-3 leading-relaxed',
                        event.isCurrent ? colors.text : 'text-neutral-600'
                      )}
                    >
                      {event.detail}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-200/50">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'px-2 py-0.5 text-xs rounded-full',
                            event.isCurrent ? 'bg-white/60' : 'bg-white',
                            'text-neutral-600'
                          )}
                        >
                          {event.role}
                        </span>
                        <span className="text-sm text-neutral-500">操作人：{event.operator}</span>
                      </div>
                      {event.isCurrent && currentStatus !== 'COMPLETED' && currentStatus !== 'REWORK' && (
                        <span className="text-xs text-neutral-500">
                          {getExpectedDuration(currentStatus)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {events.length === 0 && (
          <div className="text-center py-8">
            <AlertCircle size={40} className="mx-auto text-neutral-300 mb-3" />
            <p className="text-neutral-500 text-sm">暂无状态流转记录</p>
          </div>
        )}
      </div>
    </div>
  );
}
