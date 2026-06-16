import { Search, Filter } from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';
import type { StatusType, ProductType } from '@/types';

const statusOptions: { value: StatusType; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待量体' },
  { value: 'fitting', label: '试穿中' },
  { value: 'adjusting', label: '调整中' },
  { value: 'completed', label: '已完成' },
];

const productOptions: { value: ProductType; label: string }[] = [
  { value: 'all', label: '全部类型' },
  { value: 'suit', label: '西装' },
  { value: 'wedding-dress', label: '婚纱' },
  { value: 'custom', label: '定制' },
];

export function FilterBar() {
  const { statusFilter, productFilter, searchQuery, setStatusFilter, setProductFilter, setSearchQuery } = useOrderStore();

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索客户姓名或订单号..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusType)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value as ProductType)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
          >
            {productOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
