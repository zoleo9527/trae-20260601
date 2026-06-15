import { ComplaintStatus, UserRole } from '@/data/types';
import { statusOptions, userRoleOptions } from '@/data/mockData';
import { Search, Filter } from 'lucide-react';

interface FilterBarProps {
  statusFilter: ComplaintStatus | 'all';
  roleFilter: UserRole | 'all';
  searchQuery: string;
  onStatusChange: (status: ComplaintStatus | 'all') => void;
  onRoleChange: (role: UserRole | 'all') => void;
  onSearchChange: (query: string) => void;
}

export default function FilterBar({
  statusFilter,
  roleFilter,
  searchQuery,
  onStatusChange,
  onRoleChange,
  onSearchChange,
}: FilterBarProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索工单编号、客户名称、产品型号..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as ComplaintStatus | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">全部状态</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <select
            value={roleFilter}
            onChange={(e) => onRoleChange(e.target.value as UserRole | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">全部角色</option>
            {userRoleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
