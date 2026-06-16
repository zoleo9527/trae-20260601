import { useEffect, useState } from 'react';
import { FilterBar } from '@/components/Dashboard/FilterBar';
import { OrderList } from '@/components/Dashboard/OrderList';
import { useOrderStore } from '@/store/orderStore';
import { getOrders } from '@/data/mockData';
import { Loader2 } from 'lucide-react';

interface DashboardProps {
  onSelectOrder: (orderId: string) => void;
}

export function Dashboard({ onSelectOrder }: DashboardProps) {
  const { setOrders, orders } = useOrderStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      const data = await getOrders();
      setOrders(data);
      setLoading(false);
    };
    loadOrders();
  }, [setOrders]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-navy-900">工作台</h2>
        <p className="text-gray-500 mt-1">管理定制服装订单的交付验收与售后调整</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-sm text-gray-500">总订单</p>
          <p className="text-2xl font-bold text-navy-900">{orders.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-sm text-gray-500">试穿中</p>
          <p className="text-2xl font-bold text-blue-600">
            {orders.filter(o => o.status === 'fitting').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-sm text-gray-500">调整中</p>
          <p className="text-2xl font-bold text-coral-600">
            {orders.filter(o => o.status === 'adjusting').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-sm text-gray-500">已完成</p>
          <p className="text-2xl font-bold text-mint-600">
            {orders.filter(o => o.status === 'completed').length}
          </p>
        </div>
      </div>
      
      <FilterBar />
      
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-navy-600 animate-spin" />
        </div>
      ) : (
        <OrderList onSelectOrder={onSelectOrder} />
      )}
    </div>
  );
}
