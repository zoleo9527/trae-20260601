import { TimelineEvent } from '@/types';
import { UserAvatar } from './UserAvatar';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { FileText, CheckCircle, XCircle, RotateCcw, AlertTriangle, MessageSquare, Users, Clock } from 'lucide-react';

interface TimelineProps {
  events: TimelineEvent[];
}

const eventIconMap: Record<string, React.ElementType> = {
  '创建': FileText,
  '提交审核': Clock,
  '审核通过': CheckCircle,
  '审核拒绝': XCircle,
  '退回': RotateCcw,
  '处理': CheckCircle,
  '回访': Users,
  '备注': MessageSquare,
  '异常标记': AlertTriangle,
};

const eventColorMap: Record<string, string> = {
  '创建': 'bg-gray-400',
  '提交审核': 'bg-blue-500',
  '审核通过': 'bg-green-500',
  '审核拒绝': 'bg-red-500',
  '退回': 'bg-orange-500',
  '处理': 'bg-green-500',
  '回访': 'bg-purple-500',
  '备注': 'bg-gray-500',
  '异常标记': 'bg-red-600',
};

export function Timeline({ events }: TimelineProps) {
  const sortedEvents = [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {sortedEvents.map((event, index) => {
          const Icon = eventIconMap[event.eventType] || FileText;
          const colorClass = eventColorMap[event.eventType] || 'bg-gray-400';
          const isLast = index === sortedEvents.length - 1;

          return (
            <li key={event.id}>
              <div className="relative pb-8">
                {!isLast && (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex space-x-3">
                  <div>
                    <span className={`${colorClass} h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white`}>
                      <Icon className="h-4 w-4 text-white" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p className="text-sm text-gray-900">
                        {event.description}
                      </p>
                      {event.remark && (
                        <p className="mt-1 text-sm text-gray-500 bg-gray-50 rounded p-2">
                          {event.remark}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <UserAvatar user={event.operator} size="sm" showName showRole />
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500 whitespace-nowrap">
                      {format(new Date(event.timestamp), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
