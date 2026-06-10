import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, User, ClipboardCheck, Egg } from 'lucide-react';
import type { TodoItem } from '@/lib/api';

interface TodoListProps {
  todos: TodoItem[];
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-farm-red',
  medium: 'bg-farm-orange',
  low: 'bg-farm-yellow',
};

function ElapsedTimer({ minutes }: { minutes: number | null }) {
  const [elapsed, setElapsed] = useState(minutes || 0);

  useEffect(() => {
    if (minutes === null) return;
    const timer = setInterval(() => setElapsed((e) => e + 1), 60000);
    return () => clearInterval(timer);
  }, [minutes]);

  const h = Math.floor(elapsed / 60);
  const m = elapsed % 60;

  return (
    <span className={`font-mono text-xs ${h >= 2 ? 'text-farm-red animate-pulse-overdue' : 'text-farm-muted'}`}>
      {h > 0 ? `${h}h` : ''}{m}m
    </span>
  );
}

export default function TodoList({ todos }: TodoListProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      {todos.length === 0 && (
        <div className="text-center text-farm-muted py-8">暂无待办事项</div>
      )}
      {todos.map((todo) => (
        <button
          key={`${todo.type}-${todo.id}`}
          onClick={() => navigate(todo.type === 'inspection' ? `/inspection/${todo.id}` : `/egg-records/${todo.id}`)}
          className="w-full bg-farm-card border border-farm-border rounded-lg p-4 flex items-stretch gap-3 hover:border-farm-muted transition-colors text-left"
        >
          <div className={`w-1 rounded-full shrink-0 ${PRIORITY_COLORS[todo.priority]}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-farm-text font-bold text-sm">{todo.coop_code}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded flex items-center gap-1 ${
                todo.type === 'inspection' ? 'bg-blue-500/20 text-blue-400' : 'bg-farm-orange/20 text-farm-orange'
              }`}>
                {todo.type === 'inspection' ? <ClipboardCheck size={10} /> : <Egg size={10} />}
                {todo.type === 'inspection' ? '巡检' : '产蛋'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              {todo.handler_name && (
                <span className="flex items-center gap-1 text-farm-muted">
                  <User size={10} />
                  {todo.handler_name}
                </span>
              )}
              {todo.elapsed_minutes !== null && (
                <span className="flex items-center gap-1">
                  <Clock size={10} className="text-farm-muted" />
                  <ElapsedTimer minutes={todo.elapsed_minutes} />
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
