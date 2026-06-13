import { useAppStore } from '@/store/useAppStore';
import { TodoCard } from './TodoCard';
import Empty from './Empty';
import { TodoType } from '@/types';
import { cn } from '@/lib/utils';
import { Clock, AlertCircle, RotateCcw, LayoutGrid } from 'lucide-react';

interface TodoListProps {
  onViewSchedule?: (id: string) => void;
  onViewEnrollment?: (id: string) => void;
  onViewTrainingNeed?: (id: string) => void;
  onConfirmSchedule?: (id: string) => void;
  onRejectSchedule?: (id: string) => void;
  onConfirmEnrollment?: (id: string) => void;
  onRejectEnrollment?: (id: string) => void;
  onApproveTrainingNeed?: (id: string) => void;
  onRejectTrainingNeed?: (id: string) => void;
}

const typeConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  [TodoType.TODAY]: { icon: <Clock className="w-4 h-4" />, label: '今天要办', color: 'text-blue-600' },
  [TodoType.OVERDUE]: { icon: <AlertCircle className="w-4 h-4" />, label: '已经拖延', color: 'text-red-600' },
  [TodoType.RETURNED]: { icon: <RotateCcw className="w-4 h-4" />, label: '刚刚退回', color: 'text-orange-600' },
};

export function TodoList({
  onViewSchedule,
  onViewEnrollment,
  onViewTrainingNeed,
  onConfirmSchedule,
  onRejectSchedule,
  onConfirmEnrollment,
  onRejectEnrollment,
  onApproveTrainingNeed,
  onRejectTrainingNeed,
}: TodoListProps) {
  const { todos } = useAppStore();

  const allTodos = [
    ...todos.today.map((t) => ({ ...t, sortOrder: 0 })),
    ...todos.overdue.map((t) => ({ ...t, sortOrder: 1 })),
    ...todos.returned.map((t) => ({ ...t, sortOrder: 2 })),
  ];

  const sortedTodos = allTodos.sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  if (sortedTodos.length === 0) {
    return <Empty description="暂无待办事项" />;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
        <LayoutGrid className="w-4 h-4 text-gray-600" />
        <h3 className="text-sm font-semibold text-gray-900">待办事项</h3>
        <span className="ml-auto text-xs text-gray-500">
          共 {sortedTodos.length} 项
        </span>
      </div>
      <div className="p-4 space-y-3">
        {sortedTodos.map((todo) => (
          <TodoCard
            key={todo.id}
            todo={todo}
            className={cn(
              'border-l-4',
              todo.type === TodoType.TODAY ? 'border-l-blue-500' : '',
              todo.type === TodoType.OVERDUE ? 'border-l-red-500' : '',
              todo.type === TodoType.RETURNED ? 'border-l-orange-500' : ''
            )}
            onAction={(action) => {
              if (action === '查看详情') {
                if (todo.category === 'schedule') {
                  onViewSchedule?.(todo.entityId);
                } else if (todo.category === 'enrollment') {
                  onViewEnrollment?.(todo.entityId);
                } else if (todo.category === 'training_need') {
                  onViewTrainingNeed?.(todo.entityId);
                }
              } else if (action === '审核通过') {
                onApproveTrainingNeed?.(todo.entityId);
              } else if (action === '退回' && todo.category === 'training_need') {
                onRejectTrainingNeed?.(todo.entityId);
              } else if (action === '确认排期') {
                onConfirmSchedule?.(todo.entityId);
              } else if (action === '拒绝' && todo.category === 'schedule') {
                onRejectSchedule?.(todo.entityId);
              } else if (action === '编辑名单') {
                onViewEnrollment?.(todo.entityId);
              } else if (action === '确认名单') {
                onConfirmEnrollment?.(todo.entityId);
              } else if (action === '退回' && todo.category === 'enrollment') {
                onRejectEnrollment?.(todo.entityId);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}
