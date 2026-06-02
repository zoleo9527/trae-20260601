import { STATUS_LABELS, STATUS_COLORS, type StatusLog, type ProductStatus } from '@/types';
import { formatDateTime } from '@/utils/format';
import { Eye, EyeOff } from 'lucide-react';

interface StatusTimelineProps {
  logs: StatusLog[];
  currentStatus?: ProductStatus;
}

const getTimelineDotColor = (status: ProductStatus, isCurrent: boolean) => {
  const colorMap: Record<ProductStatus, string> = {
    PENDING_RECEIVE: 'bg-charcoal-400',
    RECEIVED: 'bg-luxury-600',
    MISSING_DOCS: 'bg-coral-500',
    PENDING_APPRAISAL: 'bg-champagne-500',
    APPRAISING: 'bg-champagne-400',
    APPRAISAL_DISPUTE: 'bg-coral-600',
    APPRAISAL_FAILED: 'bg-charcoal-700',
    APPRAISAL_PASSED: 'bg-jade-500',
    PENDING_PHOTO: 'bg-champagne-500',
    PHOTOGRAPHING: 'bg-champagne-400',
    CUSTOMER_WITHDRAW: 'bg-coral-500',
    PENDING_LISTING: 'bg-champagne-500',
    LISTED: 'bg-jade-600',
    PRICE_CHANGING: 'bg-champagne-600',
    SOLD: 'bg-jade-500',
    PENDING_SETTLEMENT: 'bg-champagne-500',
    SETTLED: 'bg-luxury-800',
    RETURNED: 'bg-charcoal-600',
  };
  return isCurrent ? `${colorMap[status]} ring-4 ring-offset-2 ring-opacity-30` : colorMap[status];
};

export default function StatusTimeline({ logs, currentStatus }: StatusTimelineProps) {
  const sortedLogs = [...logs].sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className="space-y-1">
      {sortedLogs.map((log, index) => {
        const isCurrent = log.status === currentStatus && index === sortedLogs.length - 1;
        const isLast = index === sortedLogs.length - 1;
        const dotColor = getTimelineDotColor(log.status, isCurrent);

        return (
          <div key={log.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`timeline-dot ${dotColor} ${isCurrent ? 'animate-pulse-soft' : ''}`} />
              {!isLast && <div className="timeline-line flex-1 min-h-[60px]" />}
            </div>

            <div className={`flex-1 pb-6 ${isLast ? 'pb-0' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`status-badge ${STATUS_COLORS[log.status]}`}>
                      {STATUS_LABELS[log.status]}
                    </span>
                    {log.visibleToCustomer ? (
                      <span className="flex items-center gap-1 text-xs text-jade-600" title="对客户可见">
                        <Eye className="w-3 h-3" />
                        客户可见
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-charcoal-500" title="内部状态">
                        <EyeOff className="w-3 h-3" />
                        内部
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-charcoal-700 mb-1">{log.description}</p>
                  <div className="flex items-center gap-4 text-xs text-charcoal-500">
                    <span>操作人：{log.operator}</span>
                    <span>{formatDateTime(log.timestamp)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
