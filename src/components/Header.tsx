import { Bell, Search, Filter } from 'lucide-react';
import type { WorkOrderStatus, Priority } from '../types';
import { statusLabels, priorityLabels } from '../types';
import { useWorkOrderStore } from '../store/workOrderStore';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showFilters?: boolean;
}

export function Header({ title, subtitle, showFilters = true }: HeaderProps) {
  const {
    filterStatus,
    filterPriority,
    searchKeyword,
    setFilterStatus,
    setFilterPriority,
    setSearchKeyword,
  } = useWorkOrderStore();

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-30">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-800">{title}</h1>
            {subtitle && <p className="text-sm text-neutral-500 mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full" />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="搜索工单号、位置、故障类型..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="input pl-10"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-neutral-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as WorkOrderStatus | 'all')}
                className="select w-auto min-w-[120px]"
              >
                <option value="all">全部状态</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as Priority | 'all')}
                className="select w-auto min-w-[100px]"
              >
                <option value="all">全部优先级</option>
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
