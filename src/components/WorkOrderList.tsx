import { useState } from 'react';
import { Search, Filter, ListTodo } from 'lucide-react';
import { useWorkOrderStore } from '../store/workOrderStore';
import { WorkOrderCard } from './WorkOrderCard';
import { EmptyState } from './EmptyState';
import { FilterType } from '../types';

export const WorkOrderList = () => {
  const { filteredOrders, selectOrder, filter, setFilter, setSearchQuery } = useWorkOrderStore();
  const [localSearch, setLocalSearch] = useState('');

  const orders = filteredOrders();

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'today', label: '今天要办' },
    { value: 'overdue', label: '已拖延' },
    { value: 'rejected', label: '已退回' },
  ];

  const handleSearch = () => {
    setSearchQuery(localSearch);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex-1 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ListTodo className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-semibold text-gray-900">工单列表</h1>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索工单编号、标题或位置..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
          <button
            onClick={handleSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-sm bg-primary text-white rounded-md hover:bg-primary/90"
          >
            搜索
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                filter === option.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.length > 0 ? (
          orders.map((order) => (
            <WorkOrderCard
              key={order.id}
              order={order}
              onClick={() => selectOrder(order)}
            />
          ))
        ) : (
          <div className="col-span-full">
            <EmptyState />
          </div>
        )}
      </div>
    </div>
  );
};
