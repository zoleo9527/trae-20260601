
import { useEffect, useState } from 'react';
import { Search, DollarSign, Clock, User, Zap } from 'lucide-react';
import { api } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import type { Order } from '../../shared/types';
import { useAuthStore } from '../store/authStore';

export function Orders() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [refundReason, setRefundReason] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const params = statusFilter ? { status: statusFilter } : undefined;
        const data = await api.orders.list(params);
        setOrders(data);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [statusFilter]);

  const filteredOrders = orders.filter(
    (order) =>
      order.stationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRefund = async () => {
    if (selectedOrder && user) {
      try {
        const updatedOrder = await api.orders.refund(selectedOrder.id, refundReason, selectedOrder.amount, user.name);
        setOrders((prev) =>
          prev.map((o) => o.id === selectedOrder.id ? updatedOrder : o)
        );
        setRefundModalOpen(false);
        setSelectedOrder(null);
        setRefundReason('');
      } catch (error) {
        console.error('Failed to refund order:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 筛选栏 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索站点或用户..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">状态：</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部</option>
              <option value="charging">充电中</option>
              <option value="completed">已完成</option>
              <option value="interrupted">已中断</option>
              <option value="refunded">已退款</option>
            </select>
          </div>
        </div>
      </div>

      {/* 订单列表 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">订单号</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">站点/设备</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">电量</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">金额</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredOrders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="px-5 py-4">
                <span className="font-mono text-sm text-gray-900">{order.id}</span>
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-gray-900">{order.userName}</span>
                </div>
              </td>
              <td className="px-5 py-4">
                <p className="text-gray-900">{order.stationName}</p>
                <p className="text-sm text-gray-500">{order.deviceName}</p>
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center text-gray-600">
                  <Zap className="w-4 h-4 mr-1" />
                  {order.energy}kWh
                </div>
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center text-gray-900 font-medium">
                  <DollarSign className="w-4 h-4 mr-1" />
                  ¥{order.amount.toFixed(2)}
                </div>
              </td>
              <td className="px-5 py-4">
                <StatusBadge type="order" status={order.status} />
              </td>
              <td className="px-5 py-4">
                {order.status === 'interrupted' && (
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setRefundModalOpen(true);
                    }}
                    className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                  >
                    申请退款
                  </button>
                )}
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>

      {/* 退款弹窗 */}
      {refundModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">申请退款</h3>
            <p className="text-sm text-gray-600 mb-4">
              订单 <span className="font-mono">{selectedOrder.id}</span> - ¥{selectedOrder.amount.toFixed(2)}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">退款原因</label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
                placeholder="请输入退款原因"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setRefundModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleRefund}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                确认退款
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
