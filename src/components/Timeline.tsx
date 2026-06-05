import {
  FileText,
  Send,
  CheckCircle,
  XCircle,
  RefreshCw,
  Gift,
  Award,
  MessageSquare,
} from 'lucide-react';
import type { ActionLog } from '../../shared/types';
import { ACTION_LABELS, ROLE_LABELS } from '../../shared/types';

interface TimelineProps {
  logs: ActionLog[];
}

const actionIcons: Record<string, any> = {
  create: FileText,
  submit: Send,
  review_approve: CheckCircle,
  review_reject: XCircle,
  resubmit: RefreshCw,
  compensation_propose: Gift,
  compensation_approve: Award,
  compensation_reject: XCircle,
  complete: CheckCircle,
  note: MessageSquare,
};

const actionColors: Record<string, string> = {
  create: 'bg-gray-100 text-gray-600',
  submit: 'bg-blue-100 text-blue-600',
  review_approve: 'bg-emerald-100 text-emerald-600',
  review_reject: 'bg-rose-100 text-rose-600',
  resubmit: 'bg-amber-100 text-amber-600',
  compensation_propose: 'bg-purple-100 text-purple-600',
  compensation_approve: 'bg-emerald-100 text-emerald-600',
  compensation_reject: 'bg-rose-100 text-rose-600',
  complete: 'bg-emerald-100 text-emerald-600',
  note: 'bg-gray-100 text-gray-600',
};

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Timeline({ logs }: TimelineProps) {
  return (
    <div className="relative">
      {logs.map((log, index) => {
        const Icon = actionIcons[log.actionType] || FileText;
        const colorClass = actionColors[log.actionType] || 'bg-gray-100 text-gray-600';
        const isLast = index === logs.length - 1;

        return (
          <div key={log.id} className="relative flex gap-4 pb-6 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
            {!isLast && (
              <div className="absolute left-[18px] top-10 bottom-0 w-0.5 bg-gray-200" />
            )}
            
            <div className={`relative z-10 w-9 h-9 rounded-full ${colorClass} flex items-center justify-center flex-shrink-0`}>
              <Icon size={16} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900">{ACTION_LABELS[log.actionType]}</span>
                <span className="text-xs text-gray-500">
                  {ROLE_LABELS[log.operatorRole]} · {log.operatorName}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-2">{formatTime(log.timestamp)}</p>
              
              {log.remark && (
                <div className="bg-gray-50 rounded-md p-3 mb-2">
                  <p className="text-sm text-gray-700">{log.remark}</p>
                </div>
              )}
              
              {log.rejectReason && (
                <div className="bg-rose-50 border border-rose-200 rounded-md p-3 mb-2">
                  <p className="text-sm font-medium text-rose-700 mb-1">驳回原因</p>
                  <p className="text-sm text-rose-600">{log.rejectReason}</p>
                </div>
              )}
              
              {log.supplementaryNote && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-2">
                  <p className="text-sm font-medium text-amber-700 mb-1">补充备注</p>
                  <p className="text-sm text-amber-600">{log.supplementaryNote}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
