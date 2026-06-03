import { useState } from 'react';
import { Search, Calendar, X, Filter, ChevronDown } from 'lucide-react';
import type { OrderStatus, FilterParams } from '@/types';
import { STATUS_LABELS } from '@/types';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  filters: FilterParams;
  onFilterChange: (filters: FilterParams) => void;
  onReset?: () => void;
  statusOptions?: OrderStatus[];
  showStatusFilter?: boolean;
  showDateFilter?: boolean;
  showKeywordSearch?: boolean;
  keywordPlaceholder?: string;
  className?: string;
}

const ALL_STATUSES: OrderStatus[] = [
  'PENDING',
  'SCAN_UPLOADED',
  'PROCESSING',
  'ASSIGNED',
  'IN_PRODUCTION',
  'PENDING_INSPECTION',
  'COMPLETED',
  'REWORK',
];

export function FilterBar({
  filters,
  onFilterChange,
  onReset,
  statusOptions = ALL_STATUSES,
  showStatusFilter = true,
  showDateFilter = true,
  showKeywordSearch = true,
  keywordPlaceholder = '搜索订单号、客户名称、义齿类型...',
  className,
}: FilterBarProps) {
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleKeywordChange = (value: string) => {
    onFilterChange({ ...filters, keyword: value || undefined });
  };

  const handleStatusChange = (status: OrderStatus | null) => {
    onFilterChange({ ...filters, status: status || undefined });
    setStatusDropdownOpen(false);
  };

  const handleStartDateChange = (value: string) => {
    onFilterChange({ ...filters, startDate: value || undefined });
  };

  const handleEndDateChange = (value: string) => {
    onFilterChange({ ...filters, endDate: value || undefined });
  };

  const hasActiveFilters = () => {
    return (
      filters.status ||
      filters.startDate ||
      filters.endDate ||
      (filters.keyword && filters.keyword.trim())
    );
  };

  const handleReset = () => {
    onFilterChange({});
    onReset?.();
  };

  const activeFilterCount = [
    filters.status,
    filters.startDate,
    filters.endDate,
    filters.keyword,
  ].filter(Boolean).length;

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden',
        className
      )}
    >
      {/* Main Filter Row */}
      <div className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Keyword Search */}
          {showKeywordSearch && (
            <div className="flex-1 relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                type="text"
                value={filters.keyword || ''}
                onChange={(e) => handleKeywordChange(e.target.value)}
                placeholder={keywordPlaceholder}
                className="w-full pl-10 pr-10 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
              {filters.keyword && (
                <button
                  onClick={() => handleKeywordChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          {/* Status Filter */}
          {showStatusFilter && (
            <div className="relative">
              <button
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 border border-neutral-200 rounded-lg text-sm transition-all',
                  'hover:border-primary-200 hover:bg-primary-50/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                  filters.status && 'border-primary-300 bg-primary-50'
                )}
              >
                <Filter size={16} className="text-neutral-500" />
                <span className={cn('min-w-[80px]', filters.status ? 'text-primary-700 font-medium' : 'text-neutral-600')}>
                  {filters.status ? STATUS_LABELS[filters.status] : '全部状态'}
                </span>
                <ChevronDown
                  size={16}
                  className={cn(
                    'text-neutral-400 transition-transform duration-200',
                    statusDropdownOpen && 'rotate-180'
                  )}
                />
              </button>

              {/* Status Dropdown */}
              {statusDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg z-20 overflow-hidden animate-fade-in">
                  <button
                    onClick={() => handleStatusChange(null)}
                    className={cn(
                      'w-full px-4 py-2.5 text-left text-sm transition-colors',
                      'hover:bg-neutral-50 border-b border-neutral-100',
                      !filters.status && 'bg-primary-50 text-primary-700'
                    )}
                  >
                    全部状态
                  </button>
                  {statusOptions.map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      className={cn(
                        'w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-neutral-50',
                        filters.status === status && 'bg-primary-50 text-primary-700'
                      )}
                    >
                      {STATUS_LABELS[status]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Toggle Advanced Filters */}
          {(showDateFilter) && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 border border-neutral-200 rounded-lg text-sm transition-all',
                'hover:border-neutral-300 hover:bg-neutral-50',
                isExpanded && 'border-neutral-300 bg-neutral-50'
              )}
            >
              <Calendar size={16} className="text-neutral-500" />
              <span className="text-neutral-600">
                {isExpanded ? '收起' : '高级筛选'}
              </span>
              {activeFilterCount > 0 && (
                <span className="bg-danger-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}

          {/* Reset Button */}
          {hasActiveFilters() && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              <X size={16} />
              重置
            </button>
          )}
        </div>

        {/* Advanced Filters - Date Range */}
        {showDateFilter && isExpanded && (
          <div className="mt-4 pt-4 border-t border-neutral-100 animate-slide-in">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-500 whitespace-nowrap">
                日期范围：
              </span>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Calendar
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                  />
                  <input
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="pl-9 pr-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  />
                </div>
                <span className="text-neutral-400">至</span>
                <div className="relative">
                  <Calendar
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                  />
                  <input
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="pl-9 pr-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Quick Date Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-neutral-500">快捷：</span>
              {[
                { label: '今天', days: 0 },
                { label: '近7天', days: 7 },
                { label: '近30天', days: 30 },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(start.getDate() - item.days);
                    handleStartDateChange(start.toISOString().split('T')[0]);
                    handleEndDateChange(end.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-1.5 text-xs bg-neutral-100 text-neutral-600 rounded-md hover:bg-neutral-200 transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters() && (
        <div className="px-4 py-3 bg-neutral-50 border-t border-neutral-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-neutral-500">当前筛选：</span>
            {filters.status && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-md">
                状态：{STATUS_LABELS[filters.status]}
                <button
                  onClick={() => handleStatusChange(null)}
                  className="ml-1 hover:text-primary-900"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {filters.startDate && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-success-100 text-success-700 text-xs rounded-md">
                开始：{filters.startDate}
                <button
                  onClick={() => handleStartDateChange('')}
                  className="ml-1 hover:text-success-900"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {filters.endDate && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-success-100 text-success-700 text-xs rounded-md">
                结束：{filters.endDate}
                <button
                  onClick={() => handleEndDateChange('')}
                  className="ml-1 hover:text-success-900"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {filters.keyword && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-warning-100 text-warning-700 text-xs rounded-md">
                关键词：{filters.keyword}
                <button
                  onClick={() => handleKeywordChange('')}
                  className="ml-1 hover:text-warning-900"
                >
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {statusDropdownOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setStatusDropdownOpen(false)}
        />
      )}
    </div>
  );
}
