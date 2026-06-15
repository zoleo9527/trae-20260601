import React from 'react';
import { AnomalyType, Role } from '@/types';

interface FilterTabsProps {
  types: { value: AnomalyType | 'all'; label: string; count: number }[];
  roles: { value: Role | 'all'; label: string; count: number }[];
  selectedType: AnomalyType | 'all';
  selectedRole: Role | 'all';
  searchQuery: string;
  onTypeChange: (type: AnomalyType | 'all') => void;
  onRoleChange: (role: Role | 'all') => void;
  onSearchChange: (query: string) => void;
}

export const FilterTabs: React.FC<FilterTabsProps> = ({
  types,
  roles,
  selectedType,
  selectedRole,
  searchQuery,
  onTypeChange,
  onRoleChange,
  onSearchChange,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">异常类型：</span>
        <div className="flex flex-wrap gap-2">
          {types.map((t) => (
            <button
              key={t.value}
              onClick={() => onTypeChange(t.value)}
              className={`px-3 py-1.5 text-sm rounded transition-all duration-200 ${
                selectedType === t.value
                  ? 'bg-[#1e3a5f] text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.label}
              <span className="ml-1 opacity-75">({t.count})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">处理角色：</span>
        <div className="flex flex-wrap gap-2">
          {roles.map((r) => (
            <button
              key={r.value}
              onClick={() => onRoleChange(r.value)}
              className={`px-3 py-1.5 text-sm rounded transition-all duration-200 ${
                selectedRole === r.value
                  ? 'bg-[#1e3a5f] text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {r.label}
              <span className="ml-1 opacity-75">({r.count})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="搜索异常描述、备注..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] transition-all"
        />
      </div>
    </div>
  );
};
