import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  User,
  FileText,
  LogOut,
  Clock,
  Calendar,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Pagination } from '@/components/Pagination';
import { ROLE_COLORS, ROLE_LABELS } from '@/types';
import { cn } from '@/lib/utils';

export default function AssignmentReview() {
  const navigate = useNavigate();
  const {
    initMockData,
    getAssignments,
    setCurrentRole,
    currentRole,
    currentUser,
    setCurrentUser,
  } = useAppStore();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  useEffect(() => {
    initMockData();
    if (!currentRole) {
      setCurrentRole('DESIGNER');
    }
    if (!currentUser) {
      setCurrentUser('设计师老李');
    }
  }, [initMockData, currentRole, currentUser, setCurrentRole, setCurrentUser]);

  const result = getAssignments({ page, pageSize });

  const handleLogout = () => {
    setCurrentRole(null);
    navigate('/');
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const stats = [
    { label: '总派单数', value: result.total, color: 'text-primary-600', bg: 'bg-primary-50' },
    {
      label: '待接单',
      value: useAppStore.getState().assignments.filter((a) => a.status === 'PENDING').length,
      color: 'text-warning-600',
      bg: 'bg-warning-50',
    },
    {
      label: '进行中',
      value: useAppStore.getState().assignments.filter((a) => a.status === 'ACCEPTED').length,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: '已完成',
      value: useAppStore.getState().assignments.filter((a) => a.status === 'COMPLETED').length,
      color: 'text-success-600',
      bg: 'bg-success-50',
    },
    {
      label: '返工',
      value: useAppStore.getState().assignments.filter((a) => a.status === 'REWORK').length,
      color: 'text-danger-600',
      bg: 'bg-danger-50',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="container px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/designer')}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <ArrowLeft size={20} className="text-neutral-600" />
              </button>
              <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
                <Package size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-primary-700">派单回看</h1>
                <p className="text-xs text-neutral-500">历史派单记录查询</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <User size={16} />
                <span>{currentUser || '未登录'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-600 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
              >
                <LogOut size={16} />
                退出
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500 mb-1">{stat.label}</p>
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <Package size={24} className={stat.color} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-neutral-200 bg-gradient-to-r from-primary-500 to-primary-600">
            <h2 className="text-lg font-semibold text-white">派单记录列表</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    订单号
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    技师
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    派单次数
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    派单时间
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    完成时间
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    预计工期
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    备注
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {result.data.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-neutral-500">
                      <div className="flex flex-col items-center gap-2">
                        <FileText size={48} className="text-neutral-300" />
                        <p>暂无派单记录</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  result.data.map((assignment) => {
                    const order = useAppStore.getState().getOrderById(assignment.orderId);
                    const orderAssignments = useAppStore.getState().getAssignmentsByOrderId(assignment.orderId);
                    const sortedOrderAssignments = [...orderAssignments].sort(
                      (a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
                    );
                    const isLatest = sortedOrderAssignments[0]?.id === assignment.id;
                    return (
                      <tr
                        key={assignment.id}
                        className={`hover:bg-primary-50/30 transition-colors ${isLatest ? 'bg-primary-50/50' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-primary-600">
                              {order?.orderNo || '-'}
                            </span>
                            {isLatest && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                                最新
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center">
                              <User size={14} className="text-success-600" />
                            </div>
                            <div>
                              <span className="text-neutral-900">{assignment.technicianName}</span>
                              <p className="text-xs text-neutral-500">
                                {
                                  useAppStore
                                    .getState()
                                    .technicians.find((t) => t.id === assignment.technicianId)
                                    ?.specialty
                                }
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
                            第 {assignment.version} 次派单
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-neutral-700">
                            <Clock size={14} className="text-neutral-400" />
                            {formatDateTime(assignment.assignedAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {assignment.completedAt ? (
                            <div className="flex items-center gap-1.5 text-neutral-700">
                              <Clock size={14} className="text-neutral-400" />
                              {formatDateTime(assignment.completedAt)}
                            </div>
                          ) : (
                            <span className="text-neutral-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-neutral-700">
                            <Calendar size={14} className="text-neutral-400" />
                            {assignment.estimatedDays} 天
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={cn(
                              'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                              assignment.status === 'COMPLETED'
                                ? 'bg-success-100 text-success-700'
                                : assignment.status === 'REWORK'
                                ? 'bg-danger-100 text-danger-700'
                                : assignment.status === 'ACCEPTED'
                                ? 'bg-primary-100 text-primary-700'
                                : 'bg-warning-100 text-warning-700'
                            )}
                          >
                            {assignment.status === 'COMPLETED'
                              ? '已完成'
                              : assignment.status === 'REWORK'
                              ? '返工'
                              : assignment.status === 'ACCEPTED'
                              ? '已接单'
                              : '待接单'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p
                            className="text-sm text-neutral-600 max-w-xs truncate"
                            title={assignment.combinedRemark}
                          >
                            {assignment.combinedRemark || '-'}
                          </p>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalPages={result.totalPages}
            pageSize={pageSize}
            totalItems={result.total}
            onPageChange={setPage}
          />
        </div>
      </main>
    </div>
  );
}
