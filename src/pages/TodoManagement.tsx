import { CheckCircle, Clock, Soup, AlertTriangle, ClipboardList, Filter } from 'lucide-react';
import { useStore } from '@/store/store';
import type { TodoItem } from '@/types';

export const TodoManagement = () => {
  const { todoItems, currentUser, completeTodo } = useStore();

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriorityColor = (priority: TodoItem['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityLabel = (priority: TodoItem['priority']) => {
    switch (priority) {
      case 'high': return '紧急';
      case 'medium': return '中等';
      case 'low': return '一般';
    }
  };

  const getTypeIcon = (type: TodoItem['type']) => {
    switch (type) {
      case 'soupBase': return Soup;
      case 'soldOut': return AlertTriangle;
      case 'order': return ClipboardList;
    }
  };

  const getTypeColor = (type: TodoItem['type']) => {
    switch (type) {
      case 'soupBase': return 'text-orange-600 bg-orange-100';
      case 'soldOut': return 'text-red-600 bg-red-100';
      case 'order': return 'text-blue-600 bg-blue-100';
    }
  };

  const getTypeLabel = (type: TodoItem['type']) => {
    switch (type) {
      case 'soupBase': return '锅底备料';
      case 'soldOut': return '沽清提醒';
      case 'order': return '订单处理';
    }
  };

  const pendingTodos = todoItems.filter(t => !t.completed);
  const completedTodos = todoItems.filter(t => t.completed);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">待办事项</h2>
          <p className="text-gray-500 mt-1">{currentUser.role}的任务清单</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Filter className="h-4 w-4" />
          <span>已筛选: {currentUser.role}</span>
        </div>
      </div>

      {pendingTodos.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            待处理 ({pendingTodos.length})
          </h3>
          <div className="space-y-3">
            {pendingTodos.map((todo) => {
              const TypeIcon = getTypeIcon(todo.type);
              return (
                <div
                  key={todo.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => completeTodo(todo.id)}
                      className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-green-500 hover:bg-green-500 transition-colors flex-shrink-0 mt-0.5"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getTypeColor(todo.type)}`}>
                          <TypeIcon className="h-3 w-3" />
                          {getTypeLabel(todo.type)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(todo.priority)}`}>
                          {getPriorityLabel(todo.priority)}
                        </span>
                      </div>
                      <p className="font-medium text-gray-800 mb-1">{todo.title}</p>
                      <p className="text-sm text-gray-500">
                        关联: {todo.targetName} · 创建于 {formatTime(todo.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {completedTodos.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            已完成 ({completedTodos.length})
          </h3>
          <div className="space-y-3">
            {completedTodos.map((todo) => {
              const TypeIcon = getTypeIcon(todo.type);
              return (
                <div
                  key={todo.id}
                  className="bg-gray-50 rounded-xl border border-gray-100 p-4 opacity-70"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getTypeColor(todo.type)}`}>
                          <TypeIcon className="h-3 w-3" />
                          {getTypeLabel(todo.type)}
                        </span>
                      </div>
                      <p className="font-medium text-gray-600 line-through mb-1">{todo.title}</p>
                      <p className="text-sm text-gray-500">
                        完成于 {formatTime(todo.completedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {todoItems.length === 0 && (
        <div className="text-center py-16">
          <CheckCircle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">暂无待办事项</h3>
          <p className="text-gray-500">当前角色没有待处理的任务</p>
        </div>
      )}
    </div>
  );
};
