import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, Calendar, User, ChevronRight, Clock } from 'lucide-react';
import { useRenewalStore, useUserStore } from '../store';
import { fetchRenewals, updateRenewalStatus } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { QuickActions } from '../components/QuickActions';
import type { Renewal, RenewalFilter } from '../types';

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'completed', label: '已完成' },
  { value: 'risk', label: '风险' },
];

export function RenewalsList() {
  const { renewals, setRenewals, filter, setFilter, updateRenewal } = useRenewalStore();
  const { currentRole } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const status = searchParams.get('status') as RenewalFilter['status'];
    if (status) {
      setFilter({ status });
    }
  }, [searchParams, setFilter]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await fetchRenewals(filter);
      setRenewals(data);
      setLoading(false);
    }
    loadData();
  }, [filter, setRenewals]);

  const filteredRenewals = useMemo(() => {
    let filtered = renewals.filter(r => 
      r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.packageName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (currentRole !== 'admin') {
      filtered = filtered.filter(r => r.responsibleRole === currentRole);
    }
    
    return filtered;
  }, [renewals, searchTerm, currentRole]);

  const handleStatusChange = (status: string) => {
    setFilter(status ? { status: status as Renewal['status'] } : {});
  };

  const handleQuickAction = async (action: string, renewal: Renewal) => {
    const statusMap: Record<string, Renewal['status']> = {
      complete: 'completed',
      risk: 'risk',
      processing: 'processing',
    };
    
    const newStatus = statusMap[action];
    if (!newStatus) return;
    
    const note = action === 'risk' ? '快速标记风险' : '';
    const result = await updateRenewalStatus(renewal.id, newStatus, note);
    updateRenewal(result.renewal);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">课包续费</h1>
          <p className="text-gray-500 mt-1">管理学员课包续费任务</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索学员或课包..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">筛选:</span>
            <select
              value={filter.status || ''}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-500">
            共 {filteredRenewals.length} 条记录
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {loading ? (
            <div className="p-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4 py-4">
                  <div className="w-14 h-14 rounded-full bg-gray-200 animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="w-32 h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : filteredRenewals.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">暂无匹配的续费记录</p>
            </div>
          ) : (
            filteredRenewals.map(renewal => (
              <div
                key={renewal.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center gap-4 group"
              >
                <Link
                  to={`/renewals/${renewal.id}`}
                  className="flex items-center gap-4 flex-1 min-w-0"
                >
                  <img
                    src={renewal.studentAvatar}
                    alt={renewal.studentName}
                    className="w-14 h-14 rounded-full bg-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{renewal.studentName}</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {renewal.responsibleName}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{renewal.packageName}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        到期: {renewal.expireDate}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        更新: {renewal.updatedAt}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={renewal.status} />
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-colors" />
                  </div>
                </Link>
                <QuickActions renewal={renewal} onAction={handleQuickAction} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
