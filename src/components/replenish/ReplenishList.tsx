import { useState, useEffect } from 'react';
import { Plus, Check, X, Eye, Clock, Package, AlertCircle } from 'lucide-react';
import type { ReplenishOrder, User, OutOfStockRecord } from '@/types';
import { replenishApi, outOfStockApi } from '@/api';
import Modal from '@/components/common/Modal';

interface ReplenishListProps {
  currentUser: User;
}

const statusConfig = {
  pending: { label: '待确认', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  confirmed: { label: '已确认', color: 'bg-blue-100 text-blue-800', icon: Check },
  in_progress: { label: '补货中', color: 'bg-purple-100 text-purple-800', icon: Package },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800', icon: Check },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-600', icon: X },
};

export default function ReplenishList({ currentUser }: ReplenishListProps) {
  const [orders, setOrders] = useState<ReplenishOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ReplenishOrder | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [formData, setFormData] = useState({
    outOfStockId: '',
    requestedQuantity: '',
    remark: '',
  });
  const [availableRecords, setAvailableRecords] = useState<OutOfStockRecord[]>([]);

  useEffect(() => {
    loadOrders();
    loadAvailableRecords();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    const data = await replenishApi.list();
    setOrders(data);
    setLoading(false);
  };

  const loadAvailableRecords = async () => {
    const records = await outOfStockApi.list({ status: 'approved' });
    const filtered = records.filter(r => !r.replenishOrderId);
    setAvailableRecords(filtered);
  };

  const handleCreate = async () => {
    if (!formData.outOfStockId || !formData.requestedQuantity) return;
    
    const record = availableRecords.find(r => r.id === formData.outOfStockId);
    if (!record) return;
    
    await replenishApi.create({
      outOfStockId: record.id,
      dishId: record.dishId,
      dishName: record.dishName,
      storeId: record.storeId,
      storeName: record.storeName,
      region: record.region,
      requestedQuantity: Number(formData.requestedQuantity),
      remark: formData.remark || record.remark,
      submitterId: currentUser.id,
      submitterName: currentUser.name,
    });
    
    setShowCreateModal(false);
    setFormData({ outOfStockId: '', requestedQuantity: '', remark: '' });
    loadOrders();
    loadAvailableRecords();
  };

  const handleConfirm = async (id: string) => {
    await replenishApi.confirm(id, currentUser.id, currentUser.name);
    loadOrders();
  };

  const handleComplete = async (id: string) => {
    await replenishApi.complete(id);
    loadOrders();
  };

  const handleCancel = async () => {
    if (!selectedOrder?.id || !cancelReason) return;
    await replenishApi.cancel(selectedOrder.id, cancelReason);
    setShowCancelModal(false);
    setCancelReason('');
    loadOrders();
    loadAvailableRecords();
  };

  const handleOpenCancelModal = (order: ReplenishOrder) => {
    setSelectedOrder(order);
    setShowCancelModal(true);
  };

  const handleOpenDetailModal = (order: ReplenishOrder) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const canCreate = currentUser.role === 'supervisor';
  const canConfirm = (order: ReplenishOrder) => {
    return currentUser.role === 'purchaser' && order.status === 'pending';
  };
  const canComplete = (order: ReplenishOrder) => {
    return currentUser.role === 'purchaser' && order.status === 'confirmed';
  };
  const canCancel = (order: ReplenishOrder) => {
    return currentUser.role === 'supervisor' && order.status !== 'completed';
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">临时补货管理</h2>
          <p className="text-sm text-gray-500">创建和跟踪临时补货单，查看补货进度</p>
        </div>
        {canCreate && availableRecords.length > 0 && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>创建补货单</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">菜品名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">门店</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请数量</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建人</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">暂无补货单</td>
                </tr>
              ) : (
                orders.map((order) => {
                  const StatusIcon = statusConfig[order.status].icon;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{order.dishName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{order.storeName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{order.requestedQuantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[order.status].color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[order.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{order.submitterName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">{order.submitTime}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleOpenDetailModal(order)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="查看详情"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canConfirm(order) && (
                            <button
                              onClick={() => handleConfirm(order.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="确认补货"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          {canComplete(order) && (
                            <button
                              onClick={() => handleComplete(order.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="完成补货"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          {canCancel(order) && (
                            <button
                              onClick={() => handleOpenCancelModal(order)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="取消"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="创建临时补货单">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">售罄记录 *</label>
            <select
              value={formData.outOfStockId}
              onChange={(e) => {
                const record = availableRecords.find(r => r.id === e.target.value);
                setFormData({ 
                  ...formData, 
                  outOfStockId: e.target.value,
                  requestedQuantity: record?.quantity.toString() || '',
                  remark: record?.remark || ''
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">请选择售罄记录</option>
              {availableRecords.map((record) => (
                <option key={record.id} value={record.id}>
                  {record.dishName} - {record.storeName} ({record.quantity}份)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">补货数量 *</label>
            <input
              type="number"
              value={formData.requestedQuantity}
              onChange={(e) => setFormData({ ...formData, requestedQuantity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注说明</label>
            <textarea
              value={formData.remark}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="自动继承售罄记录的备注信息"
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              onClick={() => setShowCreateModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleCreate}
              disabled={!formData.outOfStockId || !formData.requestedQuantity}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              创建补货单
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="补货单详情">
        {selectedOrder && (
          <div className="space-y-4">
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-800">{selectedOrder.dishName}</h3>
              <div className="flex items-center mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[selectedOrder.status].color}`}>
                  {statusConfig[selectedOrder.status].label}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">门店：</span>
                <span className="text-gray-800">{selectedOrder.storeName}</span>
              </div>
              <div>
                <span className="text-gray-500">区域：</span>
                <span className="text-gray-800">{selectedOrder.region}</span>
              </div>
              <div>
                <span className="text-gray-500">申请数量：</span>
                <span className="text-gray-800">{selectedOrder.requestedQuantity}</span>
              </div>
              <div>
                <span className="text-gray-500">实际数量：</span>
                <span className="text-gray-800">{selectedOrder.actualQuantity}</span>
              </div>
              <div>
                <span className="text-gray-500">创建人：</span>
                <span className="text-gray-800">{selectedOrder.submitterName}</span>
              </div>
              <div>
                <span className="text-gray-500">创建时间：</span>
                <span className="text-gray-800">{selectedOrder.submitTime}</span>
              </div>
              {selectedOrder.confirmerName && (
                <>
                  <div>
                    <span className="text-gray-500">确认人：</span>
                    <span className="text-gray-800">{selectedOrder.confirmerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">确认时间：</span>
                    <span className="text-gray-800">{selectedOrder.confirmTime}</span>
                  </div>
                </>
              )}
              {selectedOrder.completionTime && (
                <div className="col-span-2">
                  <span className="text-gray-500">完成时间：</span>
                  <span className="text-gray-800">{selectedOrder.completionTime}</span>
                </div>
              )}
            </div>
            {selectedOrder.remark && (
              <div>
                <span className="text-gray-500 block mb-1">备注说明：</span>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{selectedOrder.remark}</p>
              </div>
            )}
            {selectedOrder.cancelReason && (
              <div className="bg-red-50 p-3 rounded-lg">
                <span className="text-red-600 block mb-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  取消原因
                </span>
                <p className="text-red-800">{selectedOrder.cancelReason}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="取消补货单">
        {selectedOrder && (
          <div className="space-y-4">
            <p className="text-gray-600">确定要取消 <strong>{selectedOrder.dishName}</strong> 的补货单吗？</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">取消原因 *</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={3}
                placeholder="请输入取消原因（将记录在系统中）"
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCancel}
                disabled={!cancelReason}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                确认取消
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
