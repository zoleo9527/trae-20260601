import React from 'react';
import { FlowLog } from '@/types';
import { UserAvatar } from './UserAvatar';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  Send,
  CheckCircle,
  FileText,
  Award,
  Package,
  XCircle,
  MessageSquare,
} from 'lucide-react';

interface FlowTimelineProps {
  logs: FlowLog[];
}

const actionConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
  submit: { icon: Send, label: '提交', color: 'text-blue-600' },
  review: { icon: CheckCircle, label: '初核', color: 'text-blue-600' },
  organize: { icon: FileText, label: '整理', color: 'text-yellow-600' },
  approve: { icon: Award, label: '终审', color: 'text-green-600' },
  issue: { icon: Package, label: '发放', color: 'text-green-600' },
  reject: { icon: XCircle, label: '退回', color: 'text-red-600' },
  note: { icon: MessageSquare, label: '备注', color: 'text-gray-600' },
  create: { icon: FileText, label: '创建', color: 'text-purple-600' },
};

export const FlowTimeline: React.FC<FlowTimelineProps> = ({ logs }) => {
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="space-y-4">
      {sortedLogs.map((log, index) => {
        const config = actionConfig[log.action] || { icon: FileText, label: log.action, color: 'text-gray-600' };
        const Icon = config.icon;
        const isFirst = index === 0;

        return (
          <div key={log.id} className="relative">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isFirst ? 'bg-primary' : 'bg-gray-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isFirst ? 'text-white' : config.color}`} />
                </div>
                {index < sortedLogs.length - 1 && (
                  <div className="w-0.5 h-full min-h-[2rem] bg-gray-200 mt-2" />
                )}
              </div>

              <div className="flex-1 pb-6">
                <div className="flex items-center gap-2 mb-2">
                  <UserAvatar name={log.operatorName} size="sm" />
                  <span className="font-medium text-text-main">{log.operatorName}</span>
                  <span className={`text-sm ${config.color}`}>{config.label}</span>
                  <span className="text-sm text-text-muted">
                    {format(new Date(log.timestamp), 'MM/dd HH:mm', { locale: zhCN })}
                  </span>
                </div>
                {log.remark && (
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-text-main">
                    {log.remark}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
