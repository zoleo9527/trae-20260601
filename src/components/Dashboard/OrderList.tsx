import { OrderCard } from './OrderCard';
import { useOrderStore } from '@/store/orderStore';
import { Package } from 'lucide-react';

interface OrderListProps {
  onSelectOrder: (orderId: string) => void;
  followUpCounts?: Record<string, number>;
}

export function OrderList({ onSelectOrder, followUpCounts = {} }: OrderListProps) {
  const { filteredOrders, orders } = useOrderStore();
  const ordersToShow = filteredOrders();

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="bg-gray-100 p-6 rounded-full mb-4">
          <Package className="w-12 h-12 text-gray-400" />
        </div>
        <p className="text-gray-500">暂无订单数据</p>
      </div>
    );
  }

  if (ordersToShow.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="bg-gray-100 p-6 rounded-full mb-4">
          <Package className="w-12 h-12 text-gray-400" />
        </div>
        <p className="text-gray-500">没有匹配的订单</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {ordersToShow.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          followUpCount={followUpCounts[order.id] || 0}
          onClick={() => onSelectOrder(order.id)}
        />
      ))}
    </div>
  );
}
