import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Calendar, MapPin, AlertTriangle, CheckCircle, User } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Card, StatusBadge, LoadingSpinner, EmptyState, formatDate } from '../components/Common';
import { examApi } from '../api/client';
import { useAuthStore } from '../stores/authStore';

export const ExamsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadExams();
  }, [search, statusFilter]);

  const loadExams = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const result = await examApi.getAll(params);
      setExams(result.exams || result);
    } catch (err: any) {
      setError(err.message || '加载考试列表失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '待预约',
      booked: '已预约',
      completed: '已完成',
      absent: '缺考',
      scored: '成绩已录',
      archived: '已归档',
      retest: '需补考',
      cancelled: '已取消',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      booked: 'bg-blue-100 text-blue-800',
      completed: 'bg-indigo-100 text-indigo-800',
      absent: 'bg-red-100 text-red-800',
      scored: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800',
      retest: 'bg-orange-100 text-orange-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const pendingCount = exams.filter(e => e.status === 'pending').length;
  const retestCount = exams.filter(e => e.status === 'retest').length;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">考试管理</h1>
            <p className="text-gray-600 mt-1">查看和管理学员考试预约</p>
          </div>
          <div className="flex gap-4">
            {pendingCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-lg">
                <Calendar className="w-5 h-5 text-yellow-600" />
                <span className="text-yellow-700 font-medium">{pendingCount} 条待预约</span>
              </div>
            )}
            {retestCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <span className="text-orange-700 font-medium">{retestCount} 条需补考</span>
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
            <option value="pending">待预约</option>
            <option value="booked">已预约</option>
            <option value="completed">已完成</option>
            <option value="scored">成绩已录</option>
            <option value="retest">需补考</option>
            <option value="absent">缺考</option>
          </select>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : exams.length === 0 ? (
          <EmptyState message="暂无考试记录" icon={<FileText className="w-12 h-12" />} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => (
              <Card
                key={exam.id}
                onClick={() => navigate(`/exams/${exam.id}`)}
                className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
                  exam.status === 'retest' || exam.status === 'absent' ? 'border-orange-200' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {exam.student?.name || '未知学员'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {exam.examType}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(exam.status)}`}>
                    {getStatusLabel(exam.status)}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  {exam.scheduledDate ? (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>考试时间：{formatDate(exam.scheduledDate)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-yellow-600">
                      <Calendar className="w-4 h-4" />
                      <span>等待预约</span>
                    </div>
                  )}
                  {exam.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>考试地点：{exam.location}</span>
                    </div>
                  )}
                  {exam.examiner && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>考试专员：{exam.examiner.realName}</span>
                    </div>
                  )}
                  {exam.score !== null && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-600 font-medium">成绩：{exam.score}分</span>
                    </div>
                  )}
                  {exam.retestFee && (
                    <div className="flex items-center gap-2 text-orange-600">
                      <AlertTriangle className="w-4 h-4" />
                      <span>补考费：¥{exam.retestFee}</span>
                    </div>
                  )}
                </div>

                {exam.status === 'retest' && (
                  <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-orange-900">需补考</p>
                        <p className="text-sm text-orange-700 mt-1">请尽快为学员预约补考时间</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                  创建时间：{formatDate(exam.createdAt)}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};