import { cn } from '@/lib/utils';
import { TodoItem, TodoType } from '@/types';
import { Clock, AlertCircle, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';

interface TodoCardProps {
  todo: TodoItem;
  onAction?: (action: string) => void;
  className?: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  [TodoType.TODAY]: <Clock className="w-4 h-4 text-blue-600" />,
  [TodoType.OVERDUE]: <AlertCircle className="w-4 h-4 text-red-600" />,
  [TodoType.RETURNED]: <RotateCcw className="w-4 h-4 text-orange-600" />,
};

const typeColors: Record<string, string> = {
  [TodoType.TODAY]: 'border-blue-200 hover:border-blue-300',
  [TodoType.OVERDUE]: 'border-red-200 hover:border-red-300 bg-red-50',
  [TodoType.RETURNED]: 'border-orange-200 hover:border-orange-300 bg-orange-50',
};

const priorityColors: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
};

export function TodoCard({ todo, onAction, className }: TodoCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border p-4 transition-all duration-200',
        typeColors[todo.type],
        className
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {typeIcons[todo.type]}
          <span className="text-xs font-medium text-gray-500">{todo.type}</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn('w-2 h-2 rounded-full', priorityColors[todo.priority])}
          />
          <span className="text-xs text-gray-500">
            {format(todo.deadline, 'MM-dd HH:mm')}
          </span>
        </div>
      </div>

      <h3 className="text-sm font-semibold text-gray-900 mb-1">{todo.title}</h3>
      <p className="text-xs text-gray-600 mb-3">{todo.description}</p>

      <div className="flex items-center gap-2">
        {todo.actions.map((action) => (
          <button
            key={action}
            onClick={() => onAction?.(action)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              action.includes('确认') || action.includes('通过')
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : action.includes('退回') || action.includes('拒绝')
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}