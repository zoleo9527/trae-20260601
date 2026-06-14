import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users as UsersIcon, Phone, CreditCard } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Card, StatusBadge, LoadingSpinner, EmptyState, formatCurrency } from '../components/Common';
import { studentApi } from '../api/client';
import { useAuthStore } from '../stores/authStore';

export const StudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadStudents();
  }, [search, statusFilter]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (user?.role === 'coach') params.coachId = user.id;

      const result = await studentApi.getAll(params);
      setStudents(result.students);
    } catch (err: any) {
      setError(err.message || '加载学员列表失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      enrolled: '报名中',
      studying: '学科学习',
      training: '练车中',
      examining: '约考中',
      graduated: '已拿证',
      dropped: '已退学',
    };
    return statusMap[status] || status;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">学员列表</h1>
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
            <option value="enrolled">报名中</option>
            <option value="studying">学科学习</option>
            <option value="training">练车中</option>
            <option value="examining">约考中</option>
            <option value="graduated">已拿证</option>
            <option value="dropped">已退学</option>
          </select>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : students.length === 0 ? (
          <EmptyState message="暂无学员" icon={<UsersIcon className="w-12 h-12" />} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {students.map((student) => (
              <Card
                key={student.id}
                onClick={() => navigate(`/students/${student.id}`)}
                className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{student.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">报考类型：{student.examType}</p>
                  </div>
                  <StatusBadge status={student.status} />
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{student.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span>总费用：{formatCurrency(student.totalPaid)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UsersIcon className="w-4 h-4" />
                    <span>总学时：{student.totalHours}小时</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                  {student.advisor && <span>招生顾问：{student.advisor.realName}</span>}
                  {student.coach && <span className="ml-2">教练：{student.coach.realName}</span>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
