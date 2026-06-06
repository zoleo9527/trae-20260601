import { useStore } from '@/store';
import { StatusBadge } from '@/components/StatusBadge';
import { UserAvatar } from '@/components/UserAvatar';
import { EmptyState } from '@/components/EmptyState';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, AlertCircle, User, Phone, AlertTriangle, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { VisitStatus } from '@/types';

export function VisitList() {
  const navigate = useNavigate();
  const { visitFilters, actions, users, refunds } = useStore();
  const { setVisitFilters, getFilteredVisits } = actions;
  const visits = getFilteredVisits();

  const statusOptions: (VisitStatus | '全部')[] = ['全部', '待回访', '回访中', '已完成', '需再次回访'];
  
  const followUpCount = visits.filter(v => v.needFollowUp).length;
  const fromAnomalyCount = visits.filter(v => {
    const refund = refunds.find(r => r.id === v.refundId);
    return refund?.hasAnomaly || refund?.status === '异常';
  }).length;
  const hasActiveFilter = visitFilters.onlyNeedFollowUp || visitFilters.onlyFromAnomaly || visitFilters.status !== '全部' || visitFilters.search || visitFilters.operator;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">家长回访管理</h1>
          <p className="mt-1 text-sm text-gray-500">共 {visits.length} 条家长回访记录</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-md text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{followUpCount} 条需跟进</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-md text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>{fromAnomalyCount} 条异常来源</span>
          </div>
        </div>
      </div>

      <div className="card p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索学生姓名、家长姓名、回访编号、退费编号、班级..."
              className="input pl-10"
              value={visitFilters.search}
              onChange={(e) => setVisitFilters({ search: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              className="select w-40"
              value={visitFilters.status}
              onChange={(e) => setVisitFilters({ status: e.target.value as VisitStatus | '全部' })}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <select
              className="select w-40"
              value={visitFilters.operator}
              onChange={(e) => setVisitFilters({ operator: e.target.value })}
            >
              <option value="">全部回访人</option>
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
              checked={visitFilters.onlyNeedFollowUp}
              onChange={(e) => setVisitFilters({ onlyNeedFollowUp: e.target.checked })}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className={`text-sm ${visitFilters.onlyNeedFollowUp ? 'text-orange-700 font-medium' : 'text-gray-600'}`}>
              只看需跟进
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={visitFilters.onlyFromAnomaly}
              onChange={(e) => setVisitFilters({ onlyFromAnomaly: e.target.checked })}
              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <span className={`text-sm ${visitFilters.onlyFromAnomaly ? 'text-red-700 font-medium' : 'text-gray-600'}`}>
              只看异常来源回访
            </span>
          </label>
          {(visitFilters.onlyNeedFollowUp || visitFilters.onlyFromAnomaly) && (
            <button
              className="text-xs text-gray-500 hover:text-gray-700 ml-2"
              onClick={() => setVisitFilters({ onlyNeedFollowUp: false, onlyFromAnomaly: false })}
            >
              清除快捷筛选
            </button>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        {visits.length === 0 ? (
          <EmptyState
            type={hasActiveFilter ? 'no-results' : 'empty'}
            title={hasActiveFilter ? '未找到匹配的回访记录' : '暂无回访记录'}
            description={hasActiveFilter ? '请尝试调整筛选条件' : '新的回访任务会在这里显示'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">回访信息</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">关联退费</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">来源</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">回访人</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {visits.map((visit) => {
                  const relatedRefund = refunds.find(r => r.id === visit.refundId);
                  const isFromAnomaly = relatedRefund?.hasAnomaly || relatedRefund?.status === '异常';
                  return (
                    <tr
                      key={visit.id}
                      className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                        visit.needFollowUp ? 'bg-orange-50/30' : ''
                      }`}
                      onClick={() => navigate(`/visits/${visit.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <Phone className="w-5 h-5 text-purple-600" />
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">{visit.studentName}</span>
                              {visit.needFollowUp && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                                  <AlertCircle className="w-3 h-3 mr-0.5" />
                                  需跟进
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{visit.className} · {visit.parentName}</div>
                            <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                              <span className="font-mono">{visit.id}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-mono">
                            {visit.refundId}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isFromAnomaly ? (
                          <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            异常来源
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">正常流程</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={visit.status} type="visit" />
                      </td>
                      <td className="px-6 py-4">
                        <UserAvatar user={visit.operator} size="sm" showName showRole />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {format(new Date(visit.createdAt), 'yyyy-MM-dd', { locale: zhCN })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(visit.createdAt), 'HH:mm', { locale: zhCN })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          className="btn-secondary text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/visits/${visit.id}`);
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
