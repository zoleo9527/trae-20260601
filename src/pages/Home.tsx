import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, User, Car, AlertTriangle, RefreshCw, Play } from 'lucide-react';
import { ordersApi, statsApi } from '@/lib/api';
import type { Order, TodayStats } from '@/types';

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: '待分配', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  in_progress: { label: '施工中', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  completed: { label: '待质检', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  rework: { label: '返工中', color: 'text-red-600', bgColor: 'bg-red-100' },
};

function OrderCard({ order }: { order: Order }) {
  const navigate = useNavigate();
  const config = statusConfig[order.status] || statusConfig.pending;

  return (
    <div
      onClick={() => navigate(`/order/${order.id}`)}
      className="bg-white rounded-lg p-4 shadow-sm border border-gray-444 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-lg text-gray-800">{order.plate}</span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
          {config.label}
        </span>
      </div>
      <div className="text-sm text-gray-400 space-y-1">
        <div className="flex items-center gap-2">
          <User size={14} />
          <span>{order.customer_name}</span>
          {order.customer_level === 'vip' && (
            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">VIP</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Car size={14} />
          <span>{order.brand} {order.model}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={14} />
          <span>{order.created_at?.slice(11, 16)}</span>
        </div>
      </div>
      {order.is_rework ? (
        <div className="mt-3 flex items-center gap-1 text-red-500 text-xs">
          <AlertTriangle size={14} />
          <span>返工单</span>
        </div>
      ) : null}
      {order.employee_name && (
        <div className="mt-2 text-xs text-gray-444">
          技师：{order.employee_name}
        </div>
      )}
    </div>
  );
}

function StatsCard({ stats }: { stats: TodayStats }) {
  const items = [
    { label: '今日工单', value: stats.summary.total_orders, color: 'bg-gray-100 text-gray-700' },
    { label: '待分配', value: stats.summary.pending_count, color: 'bg-yellow-100 text-yellow-700' },
    { label: '施工中', value: stats.summary.in_progress_count, color: 'bg-blue-100 text-blue-700' },
    { label: '需返工', value: stats.summary.rework_count, color: 'bg-red-100 text-red-700' },
    { label: '已完成', value: stats.summary.completed_count, color: 'bg-green-100 text-green-700' },
  ];

  return (
    <div className="grid grid-cols-5 gap-4 mb-6">
      {items.map((item) => (
        <div key={item.label} className={`rounded-lg p-4 ${item.color}`}>
          <div className="text-2xl font-bold">{item.value}</div>
          <div className="text-sm opacity-80">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<TodayStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersData, statsData] = await Promise.all([
        ordersApi.list('today'),
        statsApi.today(),
      ]);
      setOrders(ordersData);
      setStats(statsData);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeOrders = orders.filter((o) => !o.has_passed_inspection);
  const ordersByStatus = {
    pending: activeOrders.filter((o) => o.status === 'pending'),
    in_progress: activeOrders.filter((o) => o.status === 'in_progress'),
    rework: activeOrders.filter((o) => o.status === 'rework'),
    completed: activeOrders.filter((o) => o.status === 'completed'),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-444">加载中...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">今日施工队列</h1>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <RefreshCw size={16} />
            刷新
          </button>
        </div>
      </div>

      {stats && <StatsCard stats={stats} />}

      {stats?.low_packages.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 text-amber-700 font-medium mb-2">
            <AlertTriangle size={18} />
            套餐次数预警（剩余 ≤ 2 次）
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.low_packages.slice(0, 5).map((pkg) => (
              <span
                key={pkg.id}
                className="px-3 py-1 bg-white rounded-full text-sm border border-amber-300"
              >
                {pkg.customer_name} - {pkg.package_name} ({pkg.remaining_count}次)
              </span>
            ))}
            {stats.low_packages.length > 5 && (
              <span className="px-3 py-1 text-amber-600 text-sm">
                +{stats.low_packages.length - 5} 个
              </span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-6">
        {Object.entries(ordersByStatus).map(([status, orderList]) => {
          const config = statusConfig[status];
          return (
            <div key={status} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className={`font-semibold ${config.color}`}>
                  {config.label}
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-sm ${config.bgColor} ${config.color}`}>
                  {orderList.length}
                </span>
              </div>
              <div className="space-y-3">
                {orderList.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
                {orderList.length === 0 && (
                  <div className="text-center py-8 text-gray-300">
                    <Play size={32} className="mx-auto mb-2 opacity-50" />
                    暂无工单
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
