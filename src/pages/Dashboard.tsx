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
    count: number;
    status: string;
    label: string;
  };
  clarifications: {
    count: number;
    status: string;
    label: string;
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

const roleTodoConfig = {
  project_specialist: {
    registrations: [
      { status: 'pending', label: '待处理报名', icon: Clock, color: 'yellow' }
    ],
    clarifications: [
      { status: 'draft', label: '草稿澄清', icon: MessageCircle, color: 'gray' }
    ]
  },
  review_secretary: {
    registrations: [
      { status: 'reviewing', label: '审核中报名', icon: FileText, color: 'blue' }
    ],
    clarifications: [
      { status: 'pending_review', label: '待审核澄清', icon: Clock, color: 'yellow' }
    ]
  },
  finance: {
    registrations: [
      { status: 'approved', label: '已通过报名', icon: CheckCircle, color: 'green' }
    ],
    clarifications: [
      { status: 'approved', label: '已通过澄清', icon: CheckCircle, color: 'green' }
    ]
  },
  admin: {
    registrations: [
      { status: 'pending', label: '待处理报名', icon: Clock, color: 'yellow' },
      { status: 'reviewing', label: '审核中报名', icon: FileText, color: 'blue' },
      { status: 'approved', label: '已通过报名', icon: CheckCircle, color: 'green' }
    ],
    clarifications: [
      { status: 'draft', label: '草稿澄清', icon: MessageCircle, color: 'gray' },
      { status: 'pending_review', label: '待审核澄清', icon: Clock, color: 'yellow' },
      { status: 'approved', label: '已通过澄清', icon: CheckCircle, color: 'green' }
    ]
  }
};

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

  const getTodoCards = () => {
    const config = roleTodoConfig[currentRole] || roleTodoConfig.admin;
    const cards = [];
    
    if (currentRole === 'project_specialist' || currentRole === 'admin') {
      const regCount = todos?.registrations?.status === 'pending' ? todos.registrations.count : 0;
      cards.push({
        type: 'registration',
        status: 'pending',
        count: regCount,
        label: '待处理报名',
        icon: Clock,
        color: 'yellow'
      });
      
      const clarCount = todos?.clarifications?.status === 'draft' ? todos.clarifications.count : 0;
      cards.push({
        type: 'clarification',
        status: 'draft',
        count: clarCount,
        label: '草稿澄清',
        icon: MessageCircle,
        color: 'gray'
      });
    }
    
    if (currentRole === 'review_secretary' || currentRole === 'admin') {
      const regCount = todos?.registrations?.status === 'reviewing' ? todos.registrations.count : 0;
      cards.push({
        type: 'registration',
        status: 'reviewing',
        count: regCount,
        label: '审核中报名',
        icon: FileText,
        color: 'blue'
      });
      
      const clarCount = todos?.clarifications?.status === 'pending_review' ? todos.clarifications.count : 0;
      cards.push({
        type: 'clarification',
        status: 'pending_review',
        count: clarCount,
        label: '待审核澄清',
        icon: Clock,
        color: 'yellow'
      });
    }
    
    if (currentRole === 'finance' || currentRole === 'admin') {
      const regCount = todos?.registrations?.status === 'approved' ? todos.registrations.count : 0;
      cards.push({
        type: 'registration',
        status: 'approved',
        count: regCount,
        label: '已通过报名',
        icon: CheckCircle,
        color: 'green'
      });
      
      const clarCount = todos?.clarifications?.status === 'approved' ? todos.clarifications.count : 0;
      cards.push({
        type: 'clarification',
        status: 'approved',
        count: clarCount,
        label: '已通过澄清',
        icon: CheckCircle,
        color: 'green'
      });
    }
    
    return cards;
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
            {getTodoCards().map((card, index) => {
              const Icon = card.icon;
              const colorClasses = {
                yellow: 'bg-yellow-100 text-yellow-600',
                blue: 'bg-blue-100 text-blue-600',
                green: 'bg-green-100 text-green-600',
                gray: 'bg-gray-100 text-gray-600'
              };
              
              const params = new URLSearchParams();
              params.set('status', card.status);
              
              if (card.type === 'registration') {
                if (currentUser?.id) {
                  params.set('handlerId', currentUser.id);
                }
              } else {
                if (currentRole === 'project_specialist' && currentUser?.id) {
                  params.set('createdById', currentUser.id);
                }
              }
              
              return (
                <Link
                  key={index}
                  to={`${card.type === 'registration' ? '/registrations' : '/clarifications'}?${params}`}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[card.color as keyof typeof colorClasses]}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {card.count || 0}
                      </p>
                      <p className="text-sm text-gray-500">{card.label}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
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