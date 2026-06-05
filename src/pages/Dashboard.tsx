import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import TodoCard from '../components/TodoCard';
import { Inbox, Clock, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const { todos, currentRole, loading, fetchTodos } = useStore();

  useEffect(() => {
    fetchTodos();
  }, [currentRole]);

  const urgentCount = todos.filter((t) => t.priority === 'urgent').length;
  const highCount = todos.filter((t) => t.priority === 'high').length;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-bold text-gray-900 mb-2">待办工作台</h1>
        <p className="text-gray-500">处理分配给您的投诉事项</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center">
              <Inbox className="text-navy-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">待办总数</p>
              <p className="text-2xl font-bold text-gray-900">{todos.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
              <AlertTriangle className="text-rose-500" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">紧急</p>
              <p className="text-2xl font-bold text-rose-500">{urgentCount}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <Clock className="text-orange-500" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">高优先级</p>
              <p className="text-2xl font-bold text-orange-500">{highCount}</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-navy-900 border-t-transparent rounded-full" />
        </div>
      ) : todos.length === 0 ? (
        <div className="card p-12 text-center">
          <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无待办事项</p>
        </div>
      ) : (
        <div className="space-y-4">
          {todos.map((todo, index) => (
            <div key={todo.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
              <TodoCard complaint={todo} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
