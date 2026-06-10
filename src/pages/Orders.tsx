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
  CalendarDays,
  Sprout,
  ClipboardCheck,
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

  const [showBloomModal, setShowBloomModal] = useState(false);
  const [editBloomForecast, setEditBloomForecast] = useState('');

  const [showBloomReportModal, setShowBloomReportModal] = useState(false);
  const [editActualBloom, setEditActualBloom] = useState('');

  const [showPatrolModal, setShowPatrolModal] = useState(false);
  const [patrolDescription, setPatrolDescription] = useState('');

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

  const getOperatorName = () => {
    if (currentRole === 'grower') return '李建国';
    if (currentRole === 'sales') return '孙销售';
    return '钱主管';
  };

  const openSpecModal = (order: Order) => {
    setSelectedOrder(order);
    setEditSpec(order.spec);
    setEditQuantity(order.quantity);
    setShowSpecModal(true);
  };

  const openBloomModal = (order: Order) => {
    setSelectedOrder(order);
    setEditBloomForecast(order.bloomForecast);
    setShowBloomModal(true);
  };

  const openBloomReportModal = (order: Order) => {
    setSelectedOrder(order);
    setEditActualBloom(order.bloomActual || new Date().toISOString().split('T')[0]);
    setShowBloomReportModal(true);
  };

  const openPatrolModal = (order: Order) => {
    setSelectedOrder(order);
    setPatrolDescription(`${order.greenhouse}巡检完成，温度湿度正常，病虫害无异常`);
    setShowPatrolModal(true);
  };

  const handleSaveSpec = async () => {
    if (!selectedOrder) return;
    try {
      const result = await ordersApi.updateSpec(selectedOrder.id, editSpec, editQuantity, getOperatorName());
      setOrders(orders.map(o => o.id === selectedOrder.id ? result : o));
      setShowSpecModal(false);
      showToastMessage('规格更新成功', 'success');
    } catch (error) {
      showToastMessage('更新失败', 'error');
    }
  };

  const handleSaveBloomForecast = async () => {
    if (!selectedOrder) return;
    try {
      const result = await ordersApi.updateBloom(selectedOrder.id, editBloomForecast, getOperatorName());
      setOrders(orders.map(o => o.id === selectedOrder.id ? result : o));
      setShowBloomModal(false);
      showToastMessage('花期预测已更新，风险项已同步', 'success');
    } catch (error) {
      showToastMessage('更新失败', 'error');
    }
  };

  const handleSaveBloomReport = async () => {
    if (!selectedOrder) return;
    try {
      const result = await ordersApi.reportBloom(selectedOrder.id, editActualBloom, getOperatorName());
      setOrders(orders.map(o => o.id === selectedOrder.id ? result : o));
      setShowBloomReportModal(false);
      showToastMessage('花期已上报，可安排采收', 'success');
    } catch (error) {
      showToastMessage('上报失败', 'error');
    }
  };

  const handleSavePatrol = async () => {
    if (!selectedOrder) return;
    try {
      await ordersApi.recordPatrol({
        greenhouseId: selectedOrder.greenhouse,
        greenhouseName: selectedOrder.greenhouse,
        description: patrolDescription,
        orderId: selectedOrder.id,
        operator: getOperatorName(),
      });
      setShowPatrolModal(false);
      showToastMessage('巡检记录已提交', 'success');
    } catch (error) {
      showToastMessage('提交失败', 'error');
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
          <p className="text-forest-600 mt-1 text-sm">
            {currentRole === 'grower'
              ? '花期管理与棚区巡检'
              : '管理客户订单与排产计划'}
          </p>
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
                  <th className="text-left px-4 py-3 text-sm font-medium text-forest-600">花期</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-forest-600">棚区</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-forest-600">状态</th>
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
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-forest-700">{order.spec}</span>
                          {order.specChanged && (
                            <span className="text-xs text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                              已变更
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-forest-500">{order.quantity} {order.unit}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center gap-1 text-forest-600">
                          <CalendarDays className="w-3.5 h-3.5" />
                          <span>预计：{formatDate(order.bloomForecast)}</span>
                        </div>
                        {order.bloomActual && (
                          <div className="flex items-center gap-1 text-green-600">
                            <Sprout className="w-3.5 h-3.5" />
                            <span>实际：{formatDate(order.bloomActual)}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-forest-400" />
                        <span className="text-forest-700 text-sm">{order.greenhouse}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={order.statusText}
                        variant={statusVariants[order.status] || 'default'}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5">
                        {currentRole === 'sales' && (
                          <button
                            onClick={() => openSpecModal(order)}
                            className="text-sm text-forest-600 hover:text-forest-800 flex items-center gap-1"
                          >
                            <Edit3 className="w-4 h-4" />
                            编辑规格
                          </button>
                        )}
                        {currentRole === 'grower' && (
                          <>
                            <button
                              onClick={() => openBloomModal(order)}
                              className="text-sm text-forest-600 hover:text-forest-800 flex items-center gap-1"
                            >
                              <CalendarDays className="w-4 h-4" />
                              调整花期
                            </button>
                            <button
                              onClick={() => openBloomReportModal(order)}
                              className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
                            >
                              <Sprout className="w-4 h-4" />
                              上报花期
                            </button>
                            <button
                              onClick={() => openPatrolModal(order)}
                              className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
                            >
                              <ClipboardCheck className="w-4 h-4" />
                              棚区巡检
                            </button>
                          </>
                        )}
                      </div>
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
              <button onClick={() => setShowSpecModal(false)} className="text-forest-400 hover:text-forest-600">
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
                <input type="text" value={editSpec} onChange={(e) => setEditSpec(e.target.value)} className="input-field" placeholder="如：60cm/A级" />
              </div>
              <div>
                <label className="label-field">数量 ({selectedOrder.unit})</label>
                <input type="number" value={editQuantity} onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)} className="input-field" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowSpecModal(false)} className="btn-secondary">取消</button>
              <button onClick={handleSaveSpec} className="btn-primary flex items-center gap-2">
                <Check className="w-4 h-4" />确认修改
              </button>
            </div>
          </div>
        </div>
      )}

      {showBloomModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-forest-900">调整花期预测</h3>
              <button onClick={() => setShowBloomModal(false)} className="text-forest-400 hover:text-forest-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-cream-50 rounded-lg p-4">
                <p className="text-sm text-forest-600">{selectedOrder.orderNo} · {selectedOrder.flowerType}</p>
                <p className="text-sm text-forest-600 mt-1">棚区：{selectedOrder.greenhouse}</p>
                <p className="text-sm text-amber-600 mt-2">当前预测：{formatDate(selectedOrder.bloomForecast)}</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-700">⚠️ 调整超过1天将自动生成花期偏差风险项</p>
              </div>
              <div>
                <label className="label-field">新的预计花期</label>
                <input type="date" value={editBloomForecast} onChange={(e) => setEditBloomForecast(e.target.value)} className="input-field" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowBloomModal(false)} className="btn-secondary">取消</button>
              <button onClick={handleSaveBloomForecast} className="btn-primary flex items-center gap-2">
                <Check className="w-4 h-4" />确认调整
              </button>
            </div>
          </div>
        </div>
      )}

      {showBloomReportModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-forest-900">上报实际花期</h3>
              <button onClick={() => setShowBloomReportModal(false)} className="text-forest-400 hover:text-forest-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-700">{selectedOrder.orderNo} · {selectedOrder.flowerType}</p>
                <p className="text-sm text-green-600 mt-1">棚区：{selectedOrder.greenhouse}</p>
              </div>
              <div className="bg-forest-50 border border-forest-200 rounded-lg p-3">
                <p className="text-sm text-forest-700">🌸 上报后订单状态将更新为"包装中"，可安排采收</p>
              </div>
              <div>
                <label className="label-field">实际盛花期</label>
                <input type="date" value={editActualBloom} onChange={(e) => setEditActualBloom(e.target.value)} className="input-field" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowBloomReportModal(false)} className="btn-secondary">取消</button>
              <button onClick={handleSaveBloomReport} className="btn-primary flex items-center gap-2">
                <Sprout className="w-4 h-4" />确认上报
              </button>
            </div>
          </div>
        </div>
      )}

      {showPatrolModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-forest-900">棚区巡检记录</h3>
              <button onClick={() => setShowPatrolModal(false)} className="text-forest-400 hover:text-forest-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-amber-50 rounded-lg p-4">
                <p className="text-sm text-amber-700 font-medium">{selectedOrder.greenhouse}</p>
                <p className="text-sm text-amber-600 mt-1">负责品种：{selectedOrder.flowerType}</p>
                <p className="text-sm text-amber-600">种植员：{selectedOrder.grower}</p>
              </div>
              <div>
                <label className="label-field">巡检情况</label>
                <textarea
                  value={patrolDescription}
                  onChange={(e) => setPatrolDescription(e.target.value)}
                  className="input-field min-h-[100px] resize-none"
                  placeholder="请记录温度、湿度、病虫害、花期进度等情况..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowPatrolModal(false)} className="btn-secondary">取消</button>
              <button onClick={handleSavePatrol} className="btn-primary flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4" />提交记录
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
