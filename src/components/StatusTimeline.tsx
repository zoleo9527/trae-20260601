import type { StatusHistoryItem } from '@shared/types';
import { STATUS_LABEL, ROLE_LABEL } from '@shared/types';
import { Circle, CircleCheck, CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  history: StatusHistoryItem[];
}

const iconMap = {
  PENDING_SELECTION: Circle,
  IN_SELECTION: CircleDot,
  PENDING_QUOTE: CircleDot,
  QUOTE_REJECTED: Circle,
  QUOTE_CONFIRMED: CircleCheck,
};

const colorMap = {
  PENDING_SELECTION: 'border-brass-500 bg-brass-50 text-brass-700',
  IN_SELECTION: 'border-ochre-600 text-ochre-800',
  PENDING_QUOTE: 'border-blue-600 text-blue-700',
  QUOTE_REJECTED: 'border-red-600 text-red-700',
  QUOTE_CONFIRMED: 'border-green-700 text-green-800',
};

export default function StatusTimeline({ history }: Props) {
  if (!history || history.length === 0) {
    return (
      <div className="font-mono text-sm text-carbon-400 text-center py-8">
        暂无状态变更记录
      </div>
    );
  }

  return (
    <ol className="relative border-l-2 border-carbon-200 ml-3">
      {history.map((item, idx) => {
        const Icon = iconMap[item.toStatus] ?? Circle;
        const isLast = idx === history.length - 1;
        return (
          <li key={item.id} className="mb-6 ml-6 last:mb-0 animate-slide-up" style={{ animationDelay: `${idx * 60}ms` }}>
            <span
              className={cn(
                'absolute -left-[13px] flex items-center justify-center w-6 h-6 bg-white border-2 rounded-full',
                colorMap[item.toStatus],
              )}
            >
              <Icon size={12} strokeWidth={3} />
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <time className="font-mono text-xs text-carbon-500">
                {new Date(item.timestamp).toLocaleString('zh-CN', {
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </time>
              <span
                className={cn(
                  'font-mono text-xs uppercase tracking-wider px-2 py-0.5 border-2',
                  colorMap[item.toStatus],
                )}
              >
                {STATUS_LABEL[item.toStatus]}
              </span>
              <span className="font-mono text-sm text-carbon-700 font-semibold">
                {item.operatorName}
              </span>
              <span className="font-mono text-xs text-carbon-400 uppercase tracking-wider">
                [{ROLE_LABEL[item.operatorRole]}]
              </span>
            </div>
            <p className="font-mono text-sm text-carbon-600 mt-1">{item.remark}</p>
            {!isLast && <div className="mt-4" />}
          </li>
        );
      })}
    </ol>
  );
}
