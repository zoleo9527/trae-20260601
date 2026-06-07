import { clsx } from 'clsx';
import type { CaseStatus, ConclusionType, NotifyStatus, RecallStatus } from '../types';

const statusConfig: Record<CaseStatus, { label: string; className: string }> = {
  registered: { label: '已登记', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  tracing: { label: '溯源中', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  reinspecting: { label: '复检中', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  processing: { label: '处理中', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  recalling: { label: '召回中', className: 'bg-red-50 text-red-700 border-red-200' },
  closed: { label: '已关闭', className: 'bg-green-50 text-green-700 border-green-200' },
};

const conclusionConfig: Record<ConclusionType, { label: string; className: string }> = {
  false_alarm: { label: '误报', className: 'bg-green-100 text-green-700 border-green-200' },
  quality_issue: { label: '质量问题', className: 'bg-red-100 text-red-700 border-red-200' },
  price_adjustment: { label: '补差价', className: 'bg-amber-100 text-amber-700 border-amber-200' },
};

const notifyStatusConfig: Record<NotifyStatus, { label: string; className: string }> = {
  pending: { label: '待通知', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  notified: { label: '已通知', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  confirmed: { label: '已确认', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  returned: { label: '已退回', className: 'bg-green-100 text-green-700 border-green-200' },
};

const recallStatusConfig: Record<RecallStatus, { label: string; className: string }> = {
  pending: { label: '待启动', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  notifying: { label: '通知中', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  completed: { label: '已完成', className: 'bg-green-100 text-green-700 border-green-200' },
};

interface StatusTagProps {
  type: 'case' | 'conclusion' | 'notify' | 'recall';
  status: string;
}

export function StatusTag({ type, status }: StatusTagProps) {
  let config;
  if (type === 'case') {
    config = statusConfig[status as CaseStatus];
  } else if (type === 'conclusion') {
    config = conclusionConfig[status as ConclusionType];
  } else if (type === 'notify') {
    config = notifyStatusConfig[status as NotifyStatus];
  } else {
    config = recallStatusConfig[status as RecallStatus];
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

export function ReasonTag({ reason }: { reason: 'odor' | 'spec' | 'other' }) {
  const config = {
    odor: { label: '异味', className: 'bg-purple-50 text-purple-700 border-purple-200' },
    spec: { label: '规格不符', className: 'bg-orange-50 text-orange-700 border-orange-200' },
    other: { label: '其他', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border',
        config[reason].className
      )}
    >
      {config[reason].label}
    </span>
  );
}
