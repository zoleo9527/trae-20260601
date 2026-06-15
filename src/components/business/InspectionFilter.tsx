import { useInspectionStore } from '@/store/useInspectionStore';
import { useUserStore } from '@/store/useUserStore';
import { SearchInput } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Filter, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { InspectionStatus, Inspection } from '@/types';
import { equipmentTypes } from '@/data/equipments';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const statusOptions: { value: InspectionStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'pending_manager', label: '待经理确认' },
  { value: 'pending_dispatch', label: '待调度分配' },
  { value: 'pending_inspection', label: '待出场验机' },
  { value: 'inspecting', label: '验机中' },
  { value: 'pending_repair', label: '待维修' },
  { value: 'pending_sign', label: '待司机签收' },
  { value: 'completed', label: '已完成' },
  { value: 'disputed', label: '有争议' },
];

const priorityOptions: { value: string; label: string }[] = [
  { value: 'all', label: '全部优先级' },
  { value: 'urgent', label: '紧急' },
  { value: 'high', label: '高' },
  { value: 'normal', label: '普通' },
];

const quickFilters = [
  { key: 'todo', label: '我的待办', statuses: [] as InspectionStatus[] },
  { key: 'pending', label: '进行中', statuses: ['pending_manager', 'pending_dispatch', 'pending_inspection', 'inspecting', 'pending_sign'] as InspectionStatus[] },
  { key: 'exception', label: '异常', statuses: ['pending_repair', 'disputed'] as InspectionStatus[] },
  { key: 'completed', label: '已完成', statuses: ['completed'] as InspectionStatus[] },
];

interface InspectionFilterProps {
  className?: string;
}

export function InspectionFilter({ className }: InspectionFilterProps) {
  const { filters, setFilters, getFilteredInspections } = useInspectionStore();
  const { currentRole } = useUserStore();
  const [activeQuickFilter, setActiveQuickFilter] = useState<string>('all');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleQuickFilter = (key: string, statuses: InspectionStatus[]) => {
    setActiveQuickFilter(key);
    if (key === 'all') {
      setFilters({ status: undefined, onlyMine: false, priority: undefined, dateRange: undefined });
    } else if (key === 'todo') {
      setFilters({ status: undefined, onlyMine: true, priority: undefined, dateRange: undefined });
    } else {
      setFilters({ status: statuses, onlyMine: false, priority: undefined, dateRange: undefined });
    }
  };

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ keyword: e.target.value });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'all') {
      setFilters({ status: undefined });
    } else {
      setFilters({ status: [value as InspectionStatus] });
    }
    setActiveQuickFilter('');
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFilters({ equipmentType: value === 'all' ? undefined : value });
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'all') {
      setFilters({ priority: undefined });
    } else {
      setFilters({ priority: [value as Inspection['priority']] });
    }
    setActiveQuickFilter('');
  };

  const handleDateStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const current = filters.dateRange || ['', ''];
    setFilters({ dateRange: [value, current[1]] });
    setActiveQuickFilter('');
  };

  const handleDateEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const current = filters.dateRange || ['', ''];
    setFilters({ dateRange: [current[0], value] });
    setActiveQuickFilter('');
  };

  const handleReset = () => {
    setFilters({
      status: undefined,
      keyword: undefined,
      equipmentType: undefined,
      priority: undefined,
      dateRange: undefined,
      onlyMine: false,
    });
    setActiveQuickFilter('all');
  };

  const count = getFilteredInspections(currentRole).length;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <SearchInput
            value={filters.keyword || ''}
            onChange={handleKeywordChange}
            className="max-w-md"
          />
        </div>
        <Select
          value={filters.status?.[0] || 'all'}
          onChange={handleStatusChange}
          className="w-40"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors',
            showAdvanced
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'border-slate-300 text-slate-600 hover:bg-slate-50'
          )}
        >
          <SlidersHorizontal size={16} />
          筛选
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <RotateCcw size={14} />
          重置
        </button>
      </div>

      {showAdvanced && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select label="设备类型" value={filters.equipmentType || 'all'} onChange={handleTypeChange}>
              <option value="all">全部类型</option>
              {equipmentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
            <Select
              label="优先级"
              value={filters.priority?.[0] || 'all'}
              onChange={handlePriorityChange}
            >
              {priorityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">开始日期</label>
              <input
                type="date"
                value={filters.dateRange?.[0] || ''}
                onChange={handleDateStartChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">结束日期</label>
              <input
                type="date"
                value={filters.dateRange?.[1] || ''}
                onChange={handleDateEndChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {quickFilters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => handleQuickFilter(filter.key, filter.statuses)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-lg transition-colors',
                activeQuickFilter === filter.key
                  ? 'bg-blue-700 text-white font-medium'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="text-sm text-slate-500">
          共 <span className="font-medium text-slate-700">{count}</span> 条记录
        </div>
      </div>
    </div>
  );
}
