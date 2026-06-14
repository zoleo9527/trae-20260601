import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Clock, Users, Car, CreditCard, FileText } from 'lucide-react';
import { Layout } from '../components/Layout';
import { TodoCard } from '../components/TodoCard';
import { LoadingSpinner, EmptyState } from '../components/Common';
import { todoApi } from '../api/client';
import { useAuthStore } from '../stores/authStore';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [todos, setTodos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      setLoading(true);
      const result = await todoApi.getTodos();
      setTodos(result.todos);
    } catch (err: any) {
      setError(err.message || '加载待办失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTodoClick = (todo: any) => {
    switch (todo.type) {
      case 'training':
        navigate(`/training/${todo.id}`);
        break;
      case 'payment':
        navigate(`/payments/${todo.id}`);
        break;
      case 'exam':
        navigate(`/exams/${todo.id}`);
        break;
    }
  };

  const urgentTodos = todos.filter((t) => t.priority === 'urgent');
  const normalTodos = todos.filter((t) => t.priority !== 'urgent');

  const getStats = () => {
    const stats = {
      total: todos.length,
      training: todos.filter((t) => t.type === 'training').length,
      payment: todos.filter((t) => t.type === 'payment').length,
      exam: todos.filter((t) => t.type === 'exam').length,
      urgent: urgentTodos.length,
    };
    return stats;
  };

  const stats = getStats();

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}，{user?.realName}
          </h1>
          <p className="text-gray-600 mt-1">
            {getRoleLabel(user?.role)}工作台 · {new Date().toLocaleDateString('zh-CN')}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<Clock className="w-6 h-6" />} label="待办总数" value={stats.total} color="blue" />
          <StatCard
            icon={<AlertTriangle className="w-6 h-6" />}
            label="紧急待办"
            value={stats.urgent}
            color="red"
          />
          <StatCard icon={<Car className="w-6 h-6" />} label="练车待办" value={stats.training} color="green" />
          <StatCard
            icon={<CreditCard className="w-6 h-6" />}
            label="费用待办"
            value={stats.payment}
            color="purple"
          />
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : todos.length === 0 ? (
          <EmptyState message="暂无待办事项" icon={<CheckCircle className="w-12 h-12 text-green-500" />} />
        ) : (
          <div className="space-y-6">
            {urgentTodos.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  紧急待办
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                    {urgentTodos.length}
                  </span>
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {urgentTodos.map((todo) => (
                    <TodoCard key={todo.id} todo={todo} onClick={() => handleTodoClick(todo)} />
                  ))}
                </div>
              </div>
            )}

            {normalTodos.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">待办列表</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {normalTodos.map((todo) => (
                    <TodoCard key={todo.id} todo={todo} onClick={() => handleTodoClick(todo)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'blue' | 'red' | 'green' | 'purple';
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  );
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return '早上好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

function getRoleLabel(role?: string): string {
  const roleMap: Record<string, string> = {
    advisor: '招生顾问',
    coach: '教练',
    examiner: '考试专员',
    admin: '管理员',
  };
  return roleMap[role || ''] || role || '';
}
