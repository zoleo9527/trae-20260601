import { MessageSquare, User, Clock, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStageColor } from '@/utils/status';
import type { Remark, UserRole } from '@/types';

interface RemarkSectionProps {
  remarks: Remark[];
  maxVisible?: number;
}

const roleBorderColors: Record<UserRole, string> = {
  consultant: 'border-primary',
  manager: 'border-secondary',
  controller: 'border-success',
};

const roleBgColors: Record<UserRole, string> = {
  consultant: 'bg-primary/5',
  manager: 'bg-secondary/5',
  controller: 'bg-success/5',
};

const stageSourceLabels: Record<string, string> = {
  application: '来自销控申请',
  review: '来自经理审核',
  lock: '来自执行锁定',
  complete: '来自完成销售',
};

export default function RemarkSection({ remarks, maxVisible }: RemarkSectionProps) {
  const sortedRemarks = [...remarks].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const displayRemarks = maxVisible ? sortedRemarks.slice(0, maxVisible) : sortedRemarks;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (remarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-slate-400">
        <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">暂无备注</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayRemarks.map((remark, index) => {
        const borderColor = roleBorderColors[remark.operatorRole] || 'border-slate-300';
        const bgColor = roleBgColors[remark.operatorRole] || 'bg-slate-50';
        const sourceLabel = stageSourceLabels[remark.source] || remark.sourceName;

        return (
          <div
            key={remark.id}
            className={cn(
              'relative pl-4 border-l-2 rounded-r-lg p-3 transition-all',
              borderColor,
              bgColor,
              'hover:shadow-sm'
            )}
            style={{ marginLeft: index * 4 }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-slate-800">
                      {remark.operatorName}
                    </span>
                    <span className={cn(
                      'text-xs px-1.5 py-0.5 rounded',
                      'bg-white text-slate-500 border border-slate-200'
                    )}>
                      {remark.operatorRoleName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(remark.timestamp)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded font-medium',
                  getStageColor(remark.stage)
                )}>
                  <Tag className="w-3 h-3 inline mr-1" />
                  {remark.stageName}
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed mb-2">
              {remark.content}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <span className="inline-flex items-center px-1.5 py-0.5 bg-white/60 rounded border border-slate-200">
                  {sourceLabel}
                </span>
              </div>
              <span className="text-xs text-slate-400">
                {new Date(remark.timestamp).toLocaleString('zh-CN')}
              </span>
            </div>
          </div>
        );
      })}

      {maxVisible && sortedRemarks.length > maxVisible && (
        <p className="text-center text-xs text-slate-400 pt-2">
          还有 {sortedRemarks.length - maxVisible} 条备注
        </p>
      )}
    </div>
  );
}
