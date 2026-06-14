import {
  FileSearch,
  ClipboardList,
  Inbox,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { cn } from '../lib/utils';

type EmptyStateType =
  | 'no-pending'
  | 'no-records'
  | 'no-correction'
  | 'no-search'
  | 'no-data';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const emptyStateConfig: Record<
  EmptyStateType,
  { icon: typeof FileSearch; title: string; description: string; iconColor: string; bgColor: string }
> = {
  'no-pending': {
    icon: ClipboardList,
    title: '暂无待办事项',
    description: '当前没有需要处理的申请，您可以稍作休息或查看历史记录',
    iconColor: 'text-emerald-400',
    bgColor: 'bg-emerald-50',
  },
  'no-records': {
    icon: FileSearch,
    title: '暂无记录',
    description: '还没有相关的操作记录',
    iconColor: 'text-slate-300',
    bgColor: 'bg-slate-50',
  },
  'no-correction': {
    icon: Inbox,
    title: '暂无补正记录',
    description: '该申请尚未发送过补正通知',
    iconColor: 'text-emerald-400',
    bgColor: 'bg-emerald-50',
  },
  'no-search': {
    icon: Search,
    title: '未找到匹配结果',
    description: '请尝试更换搜索关键词或筛选条件',
    iconColor: 'text-amber-400',
    bgColor: 'bg-amber-50',
  },
  'no-data': {
    icon: FileSearch,
    title: '暂无数据',
    description: '当前没有可用的数据',
    iconColor: 'text-slate-300',
    bgColor: 'bg-slate-50',
  },
};

export function EmptyState({
  type = 'no-data',
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const config = emptyStateConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6',
        className
      )}
    >
      <div
        className={cn(
          'w-16 h-16 rounded-2xl flex items-center justify-center mb-4',
          config.bgColor
        )}
      >
        <Icon className={cn('w-8 h-8', config.iconColor)} />
      </div>
      <h3 className="text-sm font-semibold text-slate-600 mb-1.5">
        {title || config.title}
      </h3>
      <p className="text-xs text-slate-400 text-center max-w-xs leading-relaxed mb-4">
        {description || config.description}
      </p>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
}
