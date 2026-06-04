import { Clock, User } from 'lucide-react';
import type { StatusHistoryItem } from '../types';
import { formatDateTime } from '../utils/date';

interface StatusTimelineProps {
  history: StatusHistoryItem[];
}

export function StatusTimeline({ history }: StatusTimelineProps) {
  const sortedHistory = [...history].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {sortedHistory.map((item, index) => (
          <li key={index}>
            <div className="relative pb-8">
              {index !== sortedHistory.length - 1 && (
                <span
                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex space-x-3">
                <div>
                  <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                    <Clock className="h-4 w-4 text-gray-500" />
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-900 font-medium">
                      状态变更：{item.status}
                    </p>
                    {item.remark && (
                      <p className="mt-1 text-sm text-gray-600">{item.remark}</p>
                    )}
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {item.operatorName}
                    </div>
                    <div className="mt-1">{formatDateTime(item.timestamp)}</div>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
