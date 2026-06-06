import { useStore } from '@/store';
import { StatusBadge } from '@/components/StatusBadge';
import { UserAvatar } from '@/components/UserAvatar';
import { EmptyState } from '@/components/EmptyState';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, AlertTriangle, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { RefundStatus } from '@/types';

export function RefundList() {
  const navigate = useNavigate();
  const { refundFilters, actions, users } = useStore();
  const { setRefundFilters, getFilteredRefunds } = actions;
  const refunds = getFilteredRefunds();

  const statusOptions: (RefundStatus | '全部')[] = ['全部', '待审核', '审核中', '已通过', '已拒绝', '已退回', '异常'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">退费申请管理</h1>
          <p className="mt-1 text-sm text-gray-500">共 {refunds.length} 条退费申请记录</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-md text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>{refunds.filter(r => r.hasAnomaly).length} 条异常</span>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索学生姓名、家长姓名、申请编号、班级..."
              className="input pl-10"
              value={refundFilters.search}
              onChange={(e) => setRefundFilters({ search: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              className="select w-40"
              value={refundFilters.status}
              onChange={(e) => setRefundFilters({ status: e.target.value as RefundStatus | '全部' })}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <select
              className="select w-40"
              value={refundFilters.handler}
              onChange={(e) => setRefundFilters({ handler: e.target.value })}
            >
              <option value="">全部责任人</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.name} - {user.role}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {refunds.length === 0 ? (
          <EmptyState
            type={refundFilters.search || refundFilters.status !== '全部' || refundFilters.handler ? 'no-results' : 'empty'}
            title={refundFilters.search || refundFilters.status !== '全部' || refundFilters.handler ? '未找到匹配的退费申请' : '暂无退费申请记录'}
            description={refundFilters.search || refundFilters.status !== '全部' || refundFilters.handler ? '请尝试调整筛选条件' : '新的退费申请会在这里显示'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请信息</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">退费金额</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">当前责任人</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">更新时间</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {refunds.map((refund) => (
                  <tr
                    key={refund.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/refunds/${refund.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-primary-600" />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{refund.studentName}</span>
                            {refund.hasAnomaly && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                                <AlertTriangle className="w-3 h-3 mr-0.5" />
                                异常
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{refund.className} · {refund.parentName}</div>
                          <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <span className="font-mono">{refund.id}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">¥{refund.refundAmount}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {refund.mealDates.length} 天
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={refund.status} type="refund" />
                    </td>
                    <td className="px-6 py-4">
                      <UserAvatar user={refund.currentHandler} size="sm" showName showRole />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {format(new Date(refund.updatedAt), 'yyyy-MM-dd', { locale: zhCN })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(refund.updatedAt), 'HH:mm', { locale: zhCN })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        className="btn-secondary text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/refunds/${refund.id}`);
                        }}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        查看详情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
