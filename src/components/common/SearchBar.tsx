import { Search, Filter, X } from 'lucide-react';
import { useState } from 'react';

import { ReactNode } from 'react';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (keyword: string) => void;
  filters?: {
    label: string;
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
  }[];
  className?: string;
  leftContent?: ReactNode;
}

export const SearchBar = ({ placeholder = '搜索...', onSearch, filters = [], className, leftContent }: SearchBarProps) => {
  const [keyword, setKeyword] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = () => {
    onSearch(keyword);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const hasActiveFilters = filters.some((f) => f.value);

  const clearAllFilters = () => {
    setKeyword('');
    onSearch('');
    filters.forEach((f) => f.onChange(''));
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        {leftContent}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {keyword && (
            <button
              onClick={() => {
                setKeyword('');
                onSearch('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2 border rounded text-sm transition-colors ${
            showFilters || hasActiveFilters
              ? 'bg-blue-50 border-blue-200 text-blue-600'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          筛选
          {hasActiveFilters && (
            <span className="w-5 h-5 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center">
              {filters.filter((f) => f.value).length}
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
            清除
          </button>
        )}
      </div>

      {showFilters && filters.length > 0 && (
        <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filters.map((filter) => (
              <div key={filter.label}>
                <label className="block text-xs text-gray-500 mb-1">{filter.label}</label>
                <select
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">全部</option>
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
