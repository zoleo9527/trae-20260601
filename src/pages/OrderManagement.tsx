import { useState } from 'react';
import { Plus, Gift, CheckCircle, Clock, Phone, Edit2 } from 'lucide-react';
import { useStore } from '@/store/store';
import type { Order } from '@/types';

export const OrderManagement = () => {
  const { orders, verifyGroupBuy, updateOrderStatus } = useStore();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | Order['status']>('all');

  const filteredOrders = orders.filter(order => {
    if (filterStatus === 'all') return true;
    return order.status === filterStatus;
  });

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-700';
      case 'confirmed': return 'bg-blue-100 text-blue-700';
      case 'served': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
    }
  };

  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'pending': return '待确认';
      case 'confirmed': return '已确认';
      case 'served': return '已上菜';
      case 'completed': return '已完成';
      case 'cancelled': return '已取消';
    }
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDishStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-600';
      case 'cooked': return 'bg-yellow-100 text-yellow-700';
      case 'served': return 'bg-green-100 text-green-700';
    }
    return 'bg-gray-100 text-gray-600';
  };

  const getDishStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return '待做';
      case 'cooked': return '已做好';
      case 'served': return '已上菜';
    }
    return status;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">订单管理</h2>
          <p className="text-gray-500 mt-1">实时跟踪订单状态，确保服务质量</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          <Plus className="h-5 w-5" />
          新建订单
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            filterStatus === 'all'
              ? 'bg-primary-100 text-primary-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          全部
        </button>
        {(['pending', 'confirmed', 'served', 'completed', 'cancelled'] as Order['status'][]).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filterStatus === status
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {getStatusLabel(status)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">桌号</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">顾客</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">锅底</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">菜品数</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">团购</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-bold text-lg text-gray-800">{order.tableNumber}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{order.customerName}</span>
                      {order.phone && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Phone className="h-3 w-3" />
                          {order.phone}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{order.soupBase}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{order.dishes.length}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-semibold text-gray-800">¥{order.totalAmount}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.isGroupBuy ? (
                      order.groupBuyVerified ? (
                        <span className="flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircle className="h-4 w-4" />
                          已核销
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-yellow-600 text-sm">
                          <Gift className="h-4 w-4" />
                          待核销
                        </span>
                      )
                    ) : (
                      <span className="text-gray-400 text-sm">否</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">{formatTime(order.createdAt)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setSelectedOrder(order); setShowDetailModal(true); }}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {order.isGroupBuy && !order.groupBuyVerified && (
                        <button
                          onClick={() => verifyGroupBuy(order.id)}
                          className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
                        >
                          核销
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-800">{selectedOrder.tableNumber}</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                  {getStatusLabel(selectedOrder.status)}
                </span>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600">
                <span className="text-xl">&times;</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">顾客姓名</p>
                  <p className="font-medium text-gray-800">{selectedOrder.customerName}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">联系电话</p>
                  <p className="font-medium text-gray-800">{selectedOrder.phone || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">锅底类型</p>
                  <p className="font-medium text-gray-800">{selectedOrder.soupBase}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">订单金额</p>
                  <p className="font-bold text-lg text-primary-600">¥{selectedOrder.totalAmount}</p>
                </div>
              </div>

              {selectedOrder.isGroupBuy && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600">团购订单</p>
                      <p className="font-medium text-gray-800">{selectedOrder.groupBuyCode}</p>
                    </div>
                    {selectedOrder.groupBuyVerified ? (
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm">
                        <CheckCircle className="h-4 w-4" />
                        已核销
                      </span>
                    ) : (
                      <button
                        onClick={() => { verifyGroupBuy(selectedOrder.id); setShowDetailModal(false); }}
                        className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                      >
                        立即核销
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">菜品明细</p>
                <div className="space-y-2">
                  {selectedOrder.dishes.map((dish) => (
                    <div key={dish.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">{dish.name}</p>
                        <p className="text-sm text-gray-500">x{dish.quantity} · ¥{dish.price * dish.quantity}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${getDishStatusColor(dish.status)}`}>
                        {getDishStatusLabel(dish.status)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">备注</p>
                  <p className="text-gray-800 bg-gray-50 rounded-lg p-3">{selectedOrder.notes}</p>
                </div>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-500 pt-2">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  创建: {formatTime(selectedOrder.createdAt)}
                </span>
                {selectedOrder.servedAt && (
                  <span>上菜: {formatTime(selectedOrder.servedAt)}</span>
                )}
                {selectedOrder.completedAt && (
                  <span>完成: {formatTime(selectedOrder.completedAt)}</span>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                {selectedOrder.status === 'pending' && (
                  <button
                    onClick={() => { updateOrderStatus(selectedOrder.id, 'confirmed'); setShowDetailModal(false); }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    确认订单
                  </button>
                )}
                {selectedOrder.status === 'confirmed' && (
                  <button
                    onClick={() => { updateOrderStatus(selectedOrder.id, 'served'); setShowDetailModal(false); }}
                    className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors"
                  >
                    标记上菜
                  </button>
                )}
                {selectedOrder.status === 'served' && (
                  <button
                    onClick={() => { updateOrderStatus(selectedOrder.id, 'completed'); setShowDetailModal(false); }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    完成订单
                  </button>
                )}
                {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                  <button
                    onClick={() => { updateOrderStatus(selectedOrder.id, 'cancelled'); setShowDetailModal(false); }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
