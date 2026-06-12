import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  MessageCircle, 
  Clock, 
  CheckCircle,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAppStore, roleLabels } from '../lib/store';
import { formatDate } from '../lib/utils';

interface TodoCounts {
  registrations: {
    pending: number;
    reviewing: number;
    approved: number;
  };
  clarifications: {
    draft: number;
    pending_review: number;
    approved: number;
  };
}

interface Stats {
  registrations: {
    total: number;
    completed: number;
    rejected: number;
    completionRate: string;
  };
  clarifications: {
    total: number;
    published: number;
    publishRate: string;
  };
  recent: Array<{
    createdAt: string;
    status: string;
  }>;
}

export default function Dashboard() {
  const { currentRole, currentUser } = useAppStore();
  const [todos, setTodos] = useState<TodoCounts | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodos();
    fetchStats();
  }, [currentRole, currentUser]);

  const fetchTodos = async () => {
    try {
      const params = new URLSearchParams();
      params.set('role', currentRole);
      if (currentUser?.id) {
        params.set('userId', currentUser.id);
      }
      const response = await fetch(`/api/todos?${params}`);
      const data = await response.json();
      if (data.success) {
        setTodos(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/todos/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {roleLabels[currentRole]}待办事项
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              to="/registrations?status=pending"
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {todos?.registrations.pending || 0}
                  </p>
                  <p className="text-sm text-gray-500">待处理报名</p>
                </div>
              </div>
            </Link>

            <Link
              to="/registrations?status=reviewing"
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {todos?.registrations.reviewing || 0}
                  </p>
                  <p className="text-sm text-gray-500">审核中报名</p>
                </div>
              </div>
            </Link>

            <Link
              to="/registrations?status=approved"
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {todos?.registrations.approved || 0}
                  </p>
                  <p className="text-sm text-gray-500">已通过报名</p>
                </div>
              </div>
            </Link>

            <Link
              to="/clarifications?status=draft"
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {todos?.clarifications.draft || 0}
                  </p>
                  <p className="text-sm text-gray-500">草稿澄清</p>
                </div>
              </div>
            </Link>

            <Link
              to="/clarifications?status=pending_review"
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {todos?.clarifications.pending_review || 0}
                  </p>
                  <p className="text-sm text-gray-500">待审核澄清</p>
                </div>
              </div>
            </Link>

            <Link
              to="/clarifications?status=approved"
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {todos?.clarifications.approved || 0}
                  </p>
                  <p className="text-sm text-gray-500">已通过澄清</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            数据统计
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-600">报名总数</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.registrations.total || 0}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600">完成率</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.registrations.completionRate || '0'}%
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-600">澄清总数</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.clarifications.total || 0}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600">发布率</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.clarifications.publishRate || '0'}%
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            最近报名记录
          </h3>
          
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats?.recent.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'completed' ? 'bg-green-100 text-green-800' :
                        item.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}