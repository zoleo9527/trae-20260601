import { useState, useEffect } from 'react';
import { ordersApi } from '../api/endpoints';
import type { Order } from '../../shared/types.js';
import { StatusBadge } from '../components/StatusBadge';
import { useAppStore } from '../stores/appStore';
import {
  ShoppingCart,
  Filter,
  Calendar,
  User,
  Flower2,
  MapPin,
  Edit3,
  X,
  Check,
} from 'lucide-react';

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待排产' },
  { value: 'scheduled', label: '已排产' },
  { value: 'packaging', label: '包装中' },
  { value: 'inspected', label: '已质检' },
  { value: 'loading', label: '待装车' },
  { value: 'completed', label: '已完成' },
];

const statusVariants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'amber'> = {
  pending: 'default',
  scheduled: 'info',
  packaging: 'amber',
  inspected: 'success',
  loading: 'warning',
  completed: 'success',
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [editSpec, setEditSpec] = useState('');
  const [editQuantity, setEditQuantity] = useState(0);
  const { showToastMessage, currentRole } = useAppStore();

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const result = await ordersApi.getOrders(statusFilter === 'all' ? undefined : statusFilter);
      setOrders(result);
    } catch (error) {
      showToastMessage('加载订单失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openSpecModal = (order: Order) => {
    setSelectedOrder(order);
    setEditSpec(order.spec);
    setEditQuantity(order.quantity);
    setShowSpecModal(true);
  };

  const handleSaveSpec = async () => {
    if (!selectedOrder) return;

    try {
      const result = await ordersApi.updateSpec(selectedOrder.id, editSpec, editQuantity);
      setOrders(orders.map(o => o.id === selectedOrder.id ? result : o));
      setShowSpecModal(false);
      showToastMessage('规格更新成功', 'success');
      loadOrders();
    } catch (error) {
      showToastMessage('更新失败', 'error');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-forest-900">订单排产</h1>
          <p className="text-forest-600 mt-1 text-sm">管理客户订单与排产计划</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-cream-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-forest-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field text-sm w-40"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <span className="text-sm text-forest-500">共 {orders.length} 条订单</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-forest-500">加载中...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-forest-600">订单号</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-forest-600">客户</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-forest-600">花卉品种</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-forest-600">规格</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-forest-600">数量</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-forest-600">状态</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-forest-600">交货日期</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-forest-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-cream-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-forest-500" />
                        <span className="font-medium text-forest-900">{order.orderNo}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-forest-400" />
                        <span className="text-forest-700">{order.customer}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Flower2 className="w-4 h-4 text-forest-500" />
                        <span className="text-forest-700">{order.flowerType}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-forest-700">{order.spec}</span>
                        {order.specChanged && (
                          <span className="text-xs text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                            已变更
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-forest-700">
                      {order.quantity} {order.unit}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={order.statusText}
                        variant={statusVariants[order.status] || 'default'}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-forest-600">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{formatDate(order.deliveryDate)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {currentRole === 'sales' && (
                        <button
                          onClick={() => openSpecModal(order)}
                          className="text-sm text-forest-600 hover:text-forest-800 flex items-center gap-1"
                        >
                          <Edit3 className="w-4 h-4" />
                          编辑
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showSpecModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-forest-900">修改订单规格</h3>
              <button
                onClick={() => setShowSpecModal(false)}
                className="text-forest-400 hover:text-forest-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-cream-50 rounded-lg p-4">
                <p className="text-sm text-forest-600">订单号</p>
                <p className="font-medium text-forest-900">{selectedOrder.orderNo}</p>
                <p className="text-sm text-forest-600 mt-2">{selectedOrder.flowerType}</p>
              </div>

              <div>
                <label className="label-field">规格</label>
                <input
                  type="text"
                  value={editSpec}
                  onChange={(e) => setEditSpec(e.target.value)}
                  className="input-field"
                  placeholder="如：60cm/A级"
                />
              </div>

              <div>
                <label className="label-field">数量 ({selectedOrder.unit})</label>
                <input
                  type="number"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowSpecModal(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleSaveSpec}
                className="btn-primary flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                确认修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
