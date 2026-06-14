import { Send, Clock, AlertTriangle, CheckCircle, FileWarning, Shield } from 'lucide-react';
import type { CorrectionNotice } from '../types';
import { cn } from '../lib/utils';

interface CorrectionNoticeViewProps {
  notices: CorrectionNotice[];
}

const priorityLabels = {
  high: { label: '高', color: 'text-red-600 bg-red-50 border-red-200' },
  medium: { label: '中', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  low: { label: '低', color: 'text-blue-600 bg-blue-50 border-blue-200' },
};

const statusConfig = {
  pending: {
    label: '待回复',
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  replied: {
    label: '已回复',
    icon: CheckCircle,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  overdue: {
    label: '已逾期',
    icon: AlertTriangle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
};

export function CorrectionNoticeView({ notices }: CorrectionNoticeViewProps) {
  if (notices.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-50 mb-2">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
        </div>
        <p className="text-xs text-slate-500 font-medium">暂无补正记录</p>
        <p className="text-[10px] text-slate-400 mt-0.5">材料齐全，无需补正</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notices.map((notice, index) => {
        const status = statusConfig[notice.status];
        const StatusIcon = status.icon;

        return (
          <div
            key={notice.id}
            className="border rounded-xl overflow-hidden shadow-sm"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50/80 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-2">
                <Send className="w-3.5 h-3.5 text-navy-500" />
                <span className="text-xs font-semibold text-slate-700">
                  补正通知 #{index + 1}
                </span>
              </div>
              <div
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded border',
                  status.bg,
                  status.color,
                  status.border
                )}
              >
                <StatusIcon className="w-3 h-3" />
                {status.label}
              </div>
            </div>

            <div className="p-3.5 space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                <div>
                  <span className="text-slate-400">发送人</span>
                  <p className="text-slate-700 font-medium mt-0.5">
                    {notice.sender}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">发送时间</span>
                  <p className="text-slate-700 font-medium mt-0.5">
                    {notice.sentAt}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400">截止日期</span>
                <p className="text-xs text-slate-700 font-medium mt-0.5">
                  {notice.deadline}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <Shield className="w-3 h-3 text-amber-500" />
                  <p className="text-[11px] font-semibold text-slate-600">
                    补正事项（共 {notice.items.length} 项）
                  </p>
                </div>
                <div className="space-y-1.5">
                  {notice.items.map((item) => {
                  const priority = priorityLabels[item.priority];
                  return (
                    <div
                      key={item.id}
                      className="p-2.5 bg-slate-50 rounded-lg border border-slate-100"
                    >
                      <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                        <FileWarning className="w-3 h-3 text-amber-500" />
                        {item.materialName}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded border font-medium',
                          priority.color
                        )}
                      >
                        {priority.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {item.reason}
                    </p>
                    </div>
                  );
                })}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
