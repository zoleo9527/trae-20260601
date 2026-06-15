import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import OrderCard from '../components/OrderCard';
import CreateOrderModal from '../components/CreateOrderModal';
import { Search, Plus, Filter, RefreshCw, AlertTriangle, Clock, AlertCircle, Zap } from 'lucide-react';

const statusFilters = [
  { value: '', label: '全部' },
  { value: 'reserved', label: '已预约' },
  { value: 'transporting', label: '运输中' },
  { value: 'serving', label: '服务中' },
  { value: 'pending', label: '待确认' },
  { value: 'settling', label: '待结算' },
  { value: 'completed', label: '已完成' },
];

export default function HomePage() {
  const orders = useAppStore((state) => state.orders);
  const searchTerm = useAppStore((state) => state.searchTerm);
  const filterStatus = useAppStore((state) => state.filterStatus);
  const setSearchTerm = useAppStore((state) => state.setSearchTerm);
  const setFilterStatus = useAppStore((state) => state.setFilterStatus);
  const loadOrders = useAppStore((state) => state.loadOrders);
  const addNotification = useAppStore((state) => state.addNotification);
  const user = useAppStore((state) => state.user);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alertOrders, setAlertOrders] = useState<string[]>([]);

  useEffect(() => {
    const checkAlerts = () => {
      const alerts: string[] = [];
      orders.forEach((order) => {
        const scheduled = new Date(order.scheduledTime);
        const now = new Date();
        const diffMinutes = Math.floor((now.getTime() - scheduled.getTime()) / (1000 * 60));
        
        if (diffMinutes > 15 && order.status !== 'completed') {
          if (!alertOrders.includes(order.id)) {
            addNotification(`⚠️ 订单 ${order.id.slice(0, 8)} 已超时15分钟`);
          }
          alerts.push(order.id);
        }
      });
      setAlertOrders(alerts);
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 60000);
    return () => clearInterval(interval);
  }, [orders, alertOrders, addNotification]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone.includes(searchTerm) ||
      order.addressFrom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.addressTo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getOrderAlertLevel = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return 'none';
    const scheduled = new Date(order.scheduledTime);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - scheduled.getTime()) / (1000 * 60));
    
    if (order.status === 'pending') {
      const createdAt = new Date(order.createdAt);
      const pendingMinutes = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60));
      if (pendingMinutes > 30) return 'critical';
      return 'warning';
    }
    
    if (diffMinutes > 30) return 'critical';
    if (diffMinutes > 15) return 'error';
    return 'none';
  };

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    late: orders.filter((o) => {
      const scheduled = new Date(o.scheduledTime);
      const now = new Date();
      return now > scheduled && o.status !== 'completed';
    }).length,
    critical: orders.filter((o) => getOrderAlertLevel(o.id) === 'critical').length,
  };

  const canCreateOrder = user?.role === 'dispatcher';

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">订单看板</h2>
          <p className="text-sm text-gray-500 mt-1">实时追踪所有订单状态</p>
        </div>
        {canCreateOrder && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>新建订单</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            <Clock className="w-6 h-6 text-gray-400" />
          </div>
          <div className="text-sm text-gray-500">总订单数</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-200">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <AlertCircle className="w-6 h-6 text-orange-500" />
          </div>
          <div className="text-sm text-gray-500">待确认订单</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-red-200">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-red-600">{stats.late}</div>
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div className="text-sm text-gray-500">超时订单</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-red-300">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-red-700">{stats.critical}</div>
            <Zap className="w-6 h-6 text-red-600" />
          </div>
          <div className="text-sm text-gray-500">紧急订单</div>
        </div>
      </div>

      {stats.critical > 0 && (
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-4 mb-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-white font-semibold">紧急提醒</div>
                <div className="text-white/80 text-sm">有 {stats.critical} 个订单需要立即处理</div>
              </div>
            </div>
            <div className="text-white/60 text-sm">点击订单卡片查看详情</div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索客户姓名、电话、地址..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            {statusFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => loadOrders()}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          <span>刷新</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400">暂无符合条件的订单</div>
        </div>
      )}

      <CreateOrderModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
