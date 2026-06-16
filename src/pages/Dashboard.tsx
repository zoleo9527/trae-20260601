import { useEffect, useState } from 'react';
import { FilterBar } from '@/components/Dashboard/FilterBar';
import { OrderList } from '@/components/Dashboard/OrderList';
import { useOrderStore } from '@/store/orderStore';
import { getOrders, getFollowUpRecordsByOrderId } from '@/data/mockData';
import { Loader2, AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import type { PickupStatusType } from '@/types';

interface DashboardProps {
  onSelectOrder: (orderId: string) => void;
}

export function Dashboard({ onSelectOrder }: DashboardProps) {
  const {
    orders,
    followUpRecords,
    setOrders,
    setFollowUpRecords,
    setPickupStatusFilter,
    setStatusFilter,
    setProductFilter,
    setSearchQuery,
    setFollowUpFilter,
  } = useOrderStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      const data = await getOrders();
      setOrders(data);

      const allRecords: Awaited<ReturnType<typeof getFollowUpRecordsByOrderId>> = [];
      for (const order of data) {
        const records = await getFollowUpRecordsByOrderId(order.id);
        allRecords.push(...records);
      }
      setFollowUpRecords(allRecords);
      setLoading(false);
    };
    loadOrders();
  }, [setOrders, setFollowUpRecords]);

  const handleFilterDelayed = () => {
    setPickupStatusFilter('delayed' as PickupStatusType);
    setFollowUpFilter('all');
    setStatusFilter('all');
    setProductFilter('all');
    setSearchQuery('');
  };

  const handleFilterPendingFollowUp = () => {
    setPickupStatusFilter('delayed' as PickupStatusType);
    setFollowUpFilter('pending');
    setStatusFilter('all');
    setProductFilter('all');
    setSearchQuery('');
  };

  const delayedCount = orders.filter((o) => o.pickupStatus === 'delayed').length;

  const pendingFollowUpCount = orders.filter((o) => {
    if (o.pickupStatus !== 'delayed') return false;
    const count = followUpRecords.filter((r) => r.orderId === o.id).length;
    return count === 0;
  }).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-navy-900">工作台</h2>
        <p className="text-gray-500 mt-1">管理定制服装订单的交付验收与售后调整</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-sm text-gray-500">总订单</p>
          <p className="text-2xl font-bold text-navy-900">{orders.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-sm text-gray-500">试穿中</p>
          <p className="text-2xl font-bold text-blue-600">
            {orders.filter((o) => o.status === 'fitting').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-sm text-gray-500">调整中</p>
          <p className="text-2xl font-bold text-coral-600">
            {orders.filter((o) => o.status === 'adjusting').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-sm text-gray-500">已完成</p>
          <p className="text-2xl font-bold text-mint-600">
            {orders.filter((o) => o.status === 'completed').length}
          </p>
        </div>
        <button
          onClick={handleFilterDelayed}
          className="bg-gradient-to-br from-coral-50 to-orange-50 rounded-xl shadow-sm p-4 border border-coral-200 hover:shadow-md hover:border-coral-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-coral-600">延期取件</p>
              <p className="text-2xl font-bold text-coral-700">{delayedCount}</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <AlertTriangle className="w-6 h-6 text-coral-500" />
              <ChevronRight className="w-4 h-4 text-coral-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </button>
        <button
          onClick={handleFilterPendingFollowUp}
          className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl shadow-sm p-4 border border-yellow-200 hover:shadow-md hover:border-yellow-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-600">待跟进</p>
              <p className="text-2xl font-bold text-amber-700">{pendingFollowUpCount}</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Clock className="w-6 h-6 text-amber-500" />
              <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </button>
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
