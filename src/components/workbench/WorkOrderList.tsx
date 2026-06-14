import { useEffect } from 'react';
import { useWorkOrderStore } from '../../store/workOrderStore';
import WorkOrderCard from './WorkOrderCard';
import { Filter, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

const statusFilters = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待处理' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'suspended', label: '已暂停' },
];

export default function WorkOrderList() {
  const {
    filters,
    setFilters,
    getFilteredOrders,
    selectedOrderId,
    selectOrder,
    loadOrders,
    orders,
  } = useWorkOrderStore();

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = getFilteredOrders();

  const getOrderCountByStatus = (status: string) => {
    if (status === 'all') return orders.length;
    return orders.filter(o => o.status === status).length;
  };

  const getExceptionCount = () => {
    return orders.filter(o => o.exceptions.length > 0).length;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-[#1a1a2e]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#eaeaea]">工单列表</h3>
            {getExceptionCount() > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-[#e94560]/10 text-[#e94560] text-xs rounded-full">
                <AlertTriangle size={12} />
                {getExceptionCount()}
              </span>
            )}
          </div>
          <span className="text-xs text-[#a0a0a0]">{filteredOrders.length} 条</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-[#a0a0a0]" />
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() =>
                setFilters({ status: filter.value as any })
              }
              className={clsx(
                'px-3 py-1 text-xs font-medium rounded-full transition-colors flex items-center gap-1',
                filters.status === filter.value
                  ? 'bg-[#e94560] text-white'
                  : 'bg-[#1a1a2e] text-[#a0a0a0] hover:bg-[#0f3460]'
              )}
            >
              {filter.label}
              <span className={clsx(
                'px-1.5 py-0.5 rounded text-[10px]',
                filters.status === filter.value
                  ? 'bg-white/20'
                  : 'bg-[#0f3460]/30'
              )}>
                {getOrderCountByStatus(filter.value)}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-[#a0a0a0] mb-2">暂无工单</p>
            <p className="text-xs text-[#a0a0a0]">
              尝试调整筛选条件
            </p>
          </div>
        ) : (
          filteredOrders.map((order, index) => (
            <div
              key={order.id}
              style={{
                animationDelay: `${index * 50}ms`,
              }}
              className="animate-fadeIn"
            >
              <WorkOrderCard
                order={order}
                isSelected={selectedOrderId === order.id}
                onClick={() => selectOrder(order.id)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
