import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Filter, Search, Calendar, User, Clock } from 'lucide-react';
import { useStore } from '../store/useStore';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate } from '../utils/date';
import type { VisitStatus } from '../types';
import { cn } from '../utils/cn';
import { hasPermission } from '../utils/permissions';

const statusFilters: { value: VisitStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending_approval', label: '待审批' },
  { value: 'approved', label: '已批准' },
  { value: 'stuck', label: '异常卡住' },
  { value: 'completed', label: '已完成' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'cancelled', label: '已取消' },
];

export function VisitList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const { currentUser, getVisitsByCurrentUser, elders, familyMembers } = useStore();

  const filter = searchParams.get('filter') || 'all';

  let visits = getVisitsByCurrentUser();

  if (filter !== 'all') {
    visits = visits.filter(v => v.status === filter);
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    visits = visits.filter(v => {
      const elder = elders.find(e => e.id === v.elderId);
      const family = familyMembers.find(f => f.id === v.familyMemberId);
      return (
        elder?.name.toLowerCase().includes(query) ||
        v.visitorName.toLowerCase().includes(query) ||
        v.requestId.toLowerCase().includes(query) ||
        family?.name.toLowerCase().includes(query)
      );
    });
  }

  const getElderName = (elderId: string) => {
    const elder = elders.find(e => e.id === elderId);
    return elder?.name || '未知';
  };

  const canCreate = currentUser && hasPermission(currentUser.role, 'canCreateVisit');
  const canApprove = currentUser && currentUser.role === 'nurse_manager';

  const stuckVisits = visits.filter(v => v.status === 'stuck');
  const normalVisits = visits.filter(v => v.status !== 'stuck');
  const sortedVisits = [...stuckVisits, ...normalVisits];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">探视预约管理</h1>
          <p className="mt-1 text-gray-500">管理所有探视预约申请</p>
        </div>
        {canCreate && (
          <Link to="/visits/new" className="btn btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            新建预约
          </Link>
        )}
      </div>

      {stuckVisits.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
            <span className="animate-pulse">⚠️</span>
            发现 {stuckVisits.length} 条异常卡住的记录，需要立即处理！
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索老人姓名、访客姓名、申请编号..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <div className="flex flex-wrap gap-2">
                {statusFilters.map(item => (
                  <button
                    key={item.value}
                    onClick={() => setSearchParams({ filter: item.value })}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                      filter === item.value
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  申请编号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  老人
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  访客
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  探视时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  人数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  类型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedVisits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    暂无数据
                  </td>
                </tr>
              ) : (
                sortedVisits.map(visit => (
                  <tr 
                    key={visit.id} 
                    className={cn(
                      'hover:bg-gray-50 transition-colors',
                      visit.status === 'stuck' && 'bg-red-50 hover:bg-red-100'
                    )}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {visit.requestId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{getElderName(visit.elderId)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {visit.visitorName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {formatDate(visit.requestedDate)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Clock className="h-4 w-4" />
                        {visit.requestedTimeSlot}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {visit.numberOfVisitors}人
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        'text-xs font-medium px-2 py-1 rounded',
                        visit.visitType === 'emergency' 
                          ? 'bg-red-100 text-red-700' 
                          : visit.visitType === 'special'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-700'
                      )}>
                        {visit.visitType === 'emergency' ? '紧急' : visit.visitType === 'special' ? '特殊' : '常规'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={visit.status} type="visit" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        to={`/visits/${visit.id}`}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        查看详情
                      </Link>
                      {canApprove && visit.status === 'pending_approval' && (
                        <span className="mx-2 text-gray-300">|</span>
                      )}
                      {canApprove && visit.status === 'pending_approval' && (
                        <Link
                          to={`/visits/${visit.id}`}
                          className="text-success-600 hover:text-success-700 font-medium"
                        >
                          审批
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
