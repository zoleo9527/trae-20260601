import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, MapPin, AlertTriangle, CheckCircle, User, Calendar } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Card, StatusBadge, LoadingSpinner, EmptyState, formatDate, formatCurrency } from '../components/Common';
import { trainingApi } from '../api/client';
import { useAuthStore } from '../stores/authStore';

export const TrainingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [trainings, setTrainings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    loadTrainings();
  }, [search, statusFilter, dateFilter]);

  const loadTrainings = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;
      if (user?.role === 'coach') params.coachId = user.id;

      const result = await trainingApi.getAll(params);
      setTrainings(result.trainings || result);
    } catch (err: any) {
      setError(err.message || '加载学时列表失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      scheduled: '待确认',
      coach_confirmed: '教练已确认',
      hours_recorded: '学时已录',
      student_confirmed: '学员已确认',
      completed: '已完成',
      cancelled: '已取消',
      exception: '异常',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      scheduled: 'bg-yellow-100 text-yellow-800',
      coach_confirmed: 'bg-blue-100 text-blue-800',
      hours_recorded: 'bg-purple-100 text-purple-800',
      student_confirmed: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800',
      exception: 'bg-red-100 text-red-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const urgentCount = trainings.filter(t => t.status === 'exception' || 
    (t.status === 'scheduled' && isUrgent(t.scheduledAt))).length;

  const exceptionCount = trainings.filter(t => t.status === 'exception').length;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">学时管理</h1>
            <p className="text-gray-600 mt-1">查看和管理学员练车学时记录</p>
          </div>
          <div className="flex gap-4">
            {exceptionCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-red-700 font-medium">{exceptionCount} 条异常</span>
              </div>
            )}
            {urgentCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="text-yellow-700 font-medium">{urgentCount} 条紧急</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索学员姓名或电话..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">全部状态</option>
            <option value="scheduled">待确认</option>
            <option value="coach_confirmed">教练已确认</option>
            <option value="hours_recorded">学时已录</option>
            <option value="student_confirmed">学员已确认</option>
            <option value="completed">已完成</option>
            <option value="exception">异常</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">全部日期</option>
            <option value="today">今天</option>
            <option value="week">本周</option>
            <option value="month">本月</option>
          </select>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : trainings.length === 0 ? (
          <EmptyState message="暂无学时记录" icon={<Clock className="w-12 h-12" />} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trainings.map((training) => (
              <Card
                key={training.id}
                onClick={() => navigate(`/training/${training.id}`)}
                className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
                  training.status === 'exception' ? 'border-red-200' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {training.student?.name || '未知学员'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      教练：{training.coach?.realName || '未分配'}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(training.status)}`}>
                    {getStatusLabel(training.status)}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(training.scheduledAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>预约 {training.hours} 小时</span>
                    {training.actualHours && (
                      <span className="text-gray-400">· 实际 {training.actualHours} 小时</span>
                    )}
                  </div>
                  {training.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{training.location}</span>
                    </div>
                  )}
                </div>

                {training.exceptionReason && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-900">异常原因</p>
                        <p className="text-sm text-red-700 mt-1">{training.exceptionReason}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                  预约时间：{formatDate(training.createdAt)}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

function isUrgent(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const hours = diff / (1000 * 60 * 60);
  return hours <= 24 && hours > 0;
}