import React from 'react';
import { useAppStore } from '../store/useStore';
import { OrderStatus, ORDER_STATUS_LABELS } from '../types';
import { Search, Filter, X } from 'lucide-react';

interface FilterBarProps {
  showAssigneeFilter?: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({ showAssigneeFilter = true }) => {
  const { filters, setFilters, getUsersByRole, currentUser } = useAppStore();

  const installerUsers = getUsersByRole('installer');

  const handleReset = () => {
    setFilters({
      status: 'all',
      dateRange: 'week',
      assignee: 'all',
      priority: 'all',
      keyword: '',
    });
  };

  return (
    <div className="filter-bar">
      <div className="filter-item">
        <Search size={14} className="text-muted" />
        <input
          type="text"
          className="search-input"
          placeholder="搜索订单号、客户名、电话、地址..."
          value={filters.keyword}
          onChange={(e) => setFilters({ keyword: e.target.value })}
        />
      </div>

      <div className="filter-item">
        <span className="filter-label">状态：</span>
        <select
          className="filter-select"
          value={filters.status}
          onChange={(e) => setFilters({ status: e.target.value as OrderStatus | 'all' })}
        >
          <option value="all">全部状态</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-item">
        <span className="filter-label">时间：</span>
        <select
          className="filter-select"
          value={filters.dateRange}
          onChange={(e) => setFilters({ dateRange: e.target.value as any })}
        >
          <option value="today">今天</option>
          <option value="week">最近7天</option>
          <option value="month">最近30天</option>
          <option value="all">全部</option>
        </select>
      </div>

      {showAssigneeFilter && (
        <div className="filter-item">
          <span className="filter-label">师傅：</span>
          <select
            className="filter-select"
            value={filters.assignee}
            onChange={(e) => setFilters({ assignee: e.target.value })}
          >
            <option value="all">全部师傅</option>
            {installerUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="filter-item">
        <span className="filter-label">优先级：</span>
        <select
          className="filter-select"
          value={filters.priority}
          onChange={(e) => setFilters({ priority: e.target.value as any })}
        >
          <option value="all">全部</option>
          <option value="urgent">加急</option>
          <option value="vip">VIP</option>
          <option value="normal">普通</option>
        </select>
      </div>

      <button
        className="btn btn-ghost btn-sm"
        onClick={handleReset}
        style={{ marginLeft: 'auto' }}
      >
        <X size={14} />
        重置
      </button>
    </div>
  );
};

export default FilterBar;
