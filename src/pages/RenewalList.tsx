import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckSquare,
  Square,
  ArrowDownUp,
  Send,
  CalendarPlus,
  Download,
  MoreHorizontal,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { Avatar } from '@/components/Avatar';
import { useRenewalStore } from '@/store/useRenewalStore';
import { useStudentStore } from '@/store/useStudentStore';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/date';
import { RenewalStatus, RiskLevel } from '@/types';

const statusFilters: { value: RenewalStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待跟进' },
  { value: 'contacted', label: '已联系' },
  { value: 'negotiating', label: '洽谈中' },
  { value: 'signed', label: '已续费' },
  { value: 'lost', label: '已流失' },
];

const RenewalList: React.FC = () => {
  const navigate = useNavigate();
  const {
    filterStatus,
    searchQuery,
    sortBy,
    selectedIds,
    setFilterStatus,
    setSearchQuery,
    setSortBy,
    toggleSelectId,
    selectAll,
    clearSelection,
    getFilteredRenewals,
    batchUpdateStatus,
  } = useRenewalStore();
  const { getStudentById } = useStudentStore();

  const [showBatchMenu, setShowBatchMenu] = useState(false);

  const renewalList = getFilteredRenewals();
  const allSelected = renewalList.length > 0 && selectedIds.length === renewalList.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < renewalList.length;

  const handleSelectAll = () => {
    if (allSelected) {
      clearSelection();
    } else {
      selectAll();
    }
  };

  const handleBatchStatusChange = (status: RenewalStatus) => {
    batchUpdateStatus(selectedIds, status);
    setShowBatchMenu(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 页面标题 */}
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink-900">
          续费跟进
        </h1>
        <p className="text-ink-500 mt-1">共 {renewalList.length} 条跟进记录</p>
      </div>

      {/* 筛选栏 */}
      <div className="card-base p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
            {/* 搜索 */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                type="text"
                placeholder="搜索学员姓名、班级..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-base pl-9"
              />
            </div>

            {/* 状态筛选 */}
            <div className="flex items-center gap-1">
              <Filter className="w-4 h-4 text-ink-400 mr-1" />
              {statusFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setFilterStatus(filter.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                    filterStatus === filter.value
                      ? 'bg-wine-100 text-wine-700'
                      : 'text-ink-600 hover:bg-cream-100'
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* 排序 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortBy(sortBy === 'expirationDate' ? 'riskLevel' : 'expirationDate')}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <ArrowDownUp className="w-4 h-4" />
              {sortBy === 'expirationDate' ? '按到期时间' : '按风险等级'}
            </button>
          </div>
        </div>
      </div>

      {/* 批量操作栏 */}
      {selectedIds.length > 0 && (
        <div className="card-base p-4 bg-wine-50/50 border-wine-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-wine-800">
                已选择 {selectedIds.length} 项
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBatchStatusChange('contacted')}
                className="btn-secondary flex items-center gap-1.5 text-sm py-1.5"
              >
                <Send className="w-4 h-4" />
                标记已联系
              </button>
              <button
                onClick={() => handleBatchStatusChange('negotiating')}
                className="btn-secondary flex items-center gap-1.5 text-sm py-1.5"
              >
                <CalendarPlus className="w-4 h-4" />
                设置跟进
              </button>
              <button className="btn-secondary flex items-center gap-1.5 text-sm py-1.5">
                <Download className="w-4 h-4" />
                导出
              </button>
              <button
                onClick={clearSelection}
                className="btn-ghost text-sm"
              >
                取消选择
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 续费列表 */}
      <div className="card-base overflow-hidden">
        {/* 表头 */}
        <div className="flex items-center gap-4 px-4 py-3 bg-cream-50 border-b border-cream-100">
          <button
            onClick={handleSelectAll}
            className="text-ink-400 hover:text-wine-600 transition-colors"
          >
            {allSelected ? (
              <CheckSquare className="w-5 h-5 text-wine-600" />
            ) : someSelected ? (
              <div className="w-5 h-5 border-2 border-wine-400 rounded flex items-center justify-center">
                <div className="w-2.5 h-0.5 bg-wine-400" />
              </div>
            ) : (
              <Square className="w-5 h-5" />
            )}
          </button>
          <div className="flex-1 grid grid-cols-12 gap-4 text-xs font-medium text-ink-500 uppercase tracking-wider">
            <div className="col-span-3">学员信息</div>
            <div className="col-span-2">套餐</div>
            <div className="col-span-2">到期时间</div>
            <div className="col-span-2">状态</div>
            <div className="col-span-2">风险</div>
            <div className="col-span-1 text-right">操作</div>
          </div>
        </div>

        {/* 列表 */}
        <div className="divide-y divide-cream-100">
          {renewalList.map((renewal, index) => {
            const student = getStudentById(renewal.studentId);
            const isSelected = selectedIds.includes(renewal.id);
            const isUrgent = renewal.remainingDays <= 7;

            return (
              <div
                key={renewal.id}
                className={cn(
                  'flex items-center gap-4 px-4 py-4 transition-colors group',
                  isSelected ? 'bg-wine-50/30' : 'hover:bg-cream-50/50',
                  'cursor-pointer'
                )}
                onClick={() => navigate(`/renewal/${renewal.id}`)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelectId(renewal.id);
                  }}
                  className="text-ink-300 hover:text-wine-600 transition-colors"
                >
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 text-wine-600" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>

                <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                  {/* 学员信息 */}
                  <div className="col-span-3 flex items-center gap-3">
                    <Avatar name={student?.name || ''} size="md" gender={student?.gender} />
                    <div className="min-w-0">
                      <p className="font-medium text-ink-900 truncate">
                        {student?.name}
                      </p>
                      <p className="text-xs text-ink-500 truncate">
                        {student?.className}
                      </p>
                    </div>
                  </div>

                  {/* 套餐 */}
                  <div className="col-span-2">
                    <p className="text-sm text-ink-700">{renewal.packageType}</p>
                    <p className="text-xs text-ink-500">¥{renewal.packagePrice.toLocaleString()}</p>
                  </div>

                  {/* 到期时间 */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      {isUrgent && (
                        <Clock className="w-4 h-4 text-wine-500 animate-pulse-soft" />
                      )}
                      <div>
                        <p className={cn(
                          'text-sm font-medium',
                          isUrgent ? 'text-wine-600' : 'text-ink-700'
                        )}>
                          {formatDate(renewal.expirationDate)}
                        </p>
                        <p className="text-xs text-ink-500">
                          {renewal.remainingDays} 天后到期
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 状态 */}
                  <div className="col-span-2">
                    <StatusBadge type="renewal" value={renewal.status} />
                  </div>

                  {/* 风险 */}
                  <div className="col-span-2">
                    <StatusBadge type="risk" value={renewal.riskLevel} />
                    {renewal.keyInsights.length > 0 && (
                      <p className="text-xs text-ink-500 mt-1 line-clamp-1">
                        {renewal.keyInsights[0]}
                      </p>
                    )}
                  </div>

                  {/* 操作 */}
                  <div className="col-span-1 text-right">
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 text-ink-400 hover:text-wine-600 hover:bg-wine-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {renewalList.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-cream-100 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-ink-400" />
            </div>
            <p className="text-ink-500">没有找到相关记录</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RenewalList;
