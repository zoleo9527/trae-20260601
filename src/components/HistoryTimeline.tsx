import Avatar from './Avatar';
import StatusBadge from './StatusBadge';
import { formatDateTime, roleMap, statusMap } from '../utils/format';
import type { HistoryRecord } from '../../shared/types';

interface Props {
  history: HistoryRecord[];
}

export default function HistoryTimeline({ history }: Props) {
  const sorted = [...history].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        <span className="w-1 h-4 bg-accent rounded-sm" />
        处理历史（{sorted.length}条记录）
      </h4>
      <div className="space-y-0">
        {sorted.map((h, idx) => {
          const isLast = idx === sorted.length - 1;
          const dotColor = statusMap[h.status]?.dotClass || 'bg-slate-400';
          return (
            <div key={h.id} className={`flex gap-3 ${isLast ? '' : 'timeline-line'}`}>
              <div className={`timeline-dot ${dotColor} mt-0.5 ${idx === 0 ? 'animate-pulse-dot' : ''}`} />
              <div className="flex-1 pb-5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-slate-800">{h.action}</span>
                  <StatusBadge status={h.status} />
                </div>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                  <Avatar name={h.operatorName} role={h.operatorRole} size="sm" />
                  <span className="text-slate-700">{h.operatorName}</span>
                  <span className={`px-1.5 py-0.5 rounded-sm ${roleMap[h.operatorRole].className}`}>
                    {roleMap[h.operatorRole].label}
                  </span>
                  <span className="ml-auto tabular-nums">{formatDateTime(h.createdAt)}</span>
                </div>
                {h.remark && (
                  <div className="mt-2 ml-9 pl-3 py-2 pr-3 bg-slate-50 border-l-2 border-slate-200 text-xs text-slate-600 leading-relaxed rounded-sm">
                    {h.remark}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
