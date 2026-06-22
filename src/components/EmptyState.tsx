import { Search, ClipboardList, Lamp } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  type: 'search' | 'todos' | 'workorders';
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ type, title, description, action }: EmptyStateProps) {
  const configs = {
    search: {
      icon: Search,
      iconColor: 'text-neutral-400',
      defaultTitle: '未找到相关工单',
      defaultDescription: '请尝试调整搜索关键词或筛选条件',
    },
    todos: {
      icon: ClipboardList,
      iconColor: 'text-primary-400',
      defaultTitle: '暂无待办事项',
      defaultDescription: '所有工单都已处理完毕，继续保持！',
    },
    workorders: {
      icon: Lamp,
      iconColor: 'text-warning-400',
      defaultTitle: '暂无工单记录',
      defaultDescription: '夜巡上报故障后，工单将自动生成',
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className={`w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mb-4`}>
        <Icon className={`w-10 h-10 ${config.iconColor}`} />
      </div>
      <h3 className="text-lg font-semibold text-neutral-800 mb-2">
        {title || config.defaultTitle}
      </h3>
      <p className="text-sm text-neutral-500 max-w-sm mb-6">
        {description || config.defaultDescription}
      </p>
      {action}
    </div>
  );
}
