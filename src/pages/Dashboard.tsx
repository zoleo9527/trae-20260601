import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/auth';
import {
  BookOpen,
  AlertTriangle,
  ClipboardCheck,
  Award,
  TrendingUp,
  Clock,
  Users,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  totalCourses: number;
  activeExceptions: number;
  recentAttendances: number;
  pendingCertificates: number;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'trainer_manager':
        return '培训经理';
      case 'department_head':
        return '部门负责人';
      case 'instructor':
        return '讲师';
      default:
        return '学员';
    }
  };

  const statCards = [
    {
      title: '本周课程数',
      value: stats?.totalCourses || 0,
      icon: BookOpen,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: '待处理异常',
      value: stats?.activeExceptions || 0,
      icon: AlertTriangle,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
    {
      title: '本周签到数',
      value: stats?.recentAttendances || 0,
      icon: ClipboardCheck,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: '待发证书',
      value: stats?.pendingCertificates || 0,
      icon: Award,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
  ];

  const trendData = [
    { name: '周一', value: 45 },
    { name: '周二', value: 52 },
    { name: '周三', value: 48 },
    { name: '周四', value: 61 },
    { name: '周五', value: 55 },
    { name: '周六', value: 67 },
    { name: '周日', value: 70 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getRoleLabel()}工作台
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            欢迎回来，{user?.name}！今天是{new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="card hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-xl`}>
                    <Icon className={`w-8 h-8 ${stat.textColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">本周签到趋势</h2>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">快捷操作</h2>
          </div>
          <div className="space-y-3">
            {user?.role === 'trainer_manager' && (
              <>
                <Link
                  to="/courses"
                  className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <BookOpen className="w-6 h-6 text-blue-600 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">课程管理</div>
                    <div className="text-sm text-gray-500">查看和管理所有课程</div>
                  </div>
                </Link>
                <Link
                  to="/exceptions"
                  className="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                >
                  <AlertTriangle className="w-6 h-6 text-orange-600 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">异常处理</div>
                    <div className="text-sm text-gray-500">处理签到和作业异常</div>
                  </div>
                </Link>
              </>
            )}
            {user?.role === 'instructor' && (
              <>
                <Link
                  to="/attendance"
                  className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <ClipboardCheck className="w-6 h-6 text-green-600 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">签到管理</div>
                    <div className="text-sm text-gray-500">进行课程签到</div>
                  </div>
                </Link>
              </>
            )}
            <Link
              to="/notifications"
              className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Clock className="w-6 h-6 text-purple-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">消息通知</div>
                <div className="text-sm text-gray-500">查看系统通知</div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">待办事项</h2>
          <Users className="w-5 h-5 text-gray-400" />
        </div>
        <div className="space-y-3">
          {stats?.activeExceptions ? (
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-orange-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">有 {stats.activeExceptions} 个待处理异常</div>
                  <div className="text-sm text-gray-500">需要尽快处理</div>
                </div>
              </div>
              <Link
                to="/exceptions"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                立即处理 →
              </Link>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">✅</div>
              <div>暂无待处理事项</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
