import { useStore } from '@/store';
import { StatusBadge } from '@/components/StatusBadge';
import { UserAvatar } from '@/components/UserAvatar';
import { EmptyState } from '@/components/EmptyState';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, AlertTriangle, Calendar, User, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { RefundStatus } from '@/types';

export function RefundList() {
  const navigate = useNavigate();
  const { refundFilters, actions, users, visits } = useStore();
  const { setRefundFilters, getFilteredRefunds } = actions;
  const refunds = getFilteredRefunds();

  const statusOptions: (RefundStatus | '全部')[] = ['全部', '待审核', '审核中', '已通过', '已拒绝', '已退回', '异常'];
  
  const anomalyCount = refunds.filter(r => r.hasAnomaly || r.status === '异常').length;
  const withVisitCount = refunds.filter(r => visits.some(v => v.refundId === r.id)).length;
  const hasActiveFilter = refundFilters.onlyAnomaly || refundFilters.onlyWithVisit || refundFilters.status !== '全部' || refundFilters.search || refundFilters.handler;

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
            <span>{anomalyCount} 条异常</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm">
            <MessageSquare className="w-4 h-4" />
            <span>{withVisitCount} 条有关联回访</span>
          </div>
        </div>
      </div>

      <div className="card p-4 space-y-4">
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
        
        <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-500">快捷筛选：</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={refundFilters.onlyAnomaly}
              onChange={(e) => setRefundFilters({ onlyAnomaly: e.target.checked })}
              className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <span className={`text-sm ${refundFilters.onlyAnomaly ? 'text-amber-700 font-medium' : 'text-gray-600'}`}>
              只看异常单据
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={refundFilters.onlyWithVisit}
              onChange={(e) => setRefundFilters({ onlyWithVisit: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className={`text-sm ${refundFilters.onlyWithVisit ? 'text-blue-700 font-medium' : 'text-gray-600'}`}>
              只看已关联回访
            </span>
          </label>
          {(refundFilters.onlyAnomaly || refundFilters.onlyWithVisit) && (
            <button
              className="text-xs text-gray-500 hover:text-gray-700 ml-2"
              onClick={() => setRefundFilters({ onlyAnomaly: false, onlyWithVisit: false })}
            >
              清除快捷筛选
            </button>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        {refunds.length === 0 ? (
          <EmptyState
            type={hasActiveFilter ? 'no-results' : 'empty'}
            title={hasActiveFilter ? '未找到匹配的退费申请' : '暂无退费申请记录'}
            description={hasActiveFilter ? '请尝试调整筛选条件' : '新的退费申请会在这里显示'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请信息</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">退费金额</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">关联回访</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">当前责任人</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">更新时间</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {refunds.map((refund) => {
                  const relatedVisits = visits.filter(v => v.refundId === refund.id);
                  return (
                    <tr
                      key={refund.id}
                      className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                        (refund.hasAnomaly || refund.status === '异常') ? 'bg-amber-50/30' : ''
                      }`}
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
                              {(refund.hasAnomaly || refund.status === '异常') && (
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
                        {relatedVisits.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4 text-blue-500" />
                            <span className="text-sm text-blue-600 font-medium">{relatedVisits.length} 条</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">暂无</span>
                        )}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
