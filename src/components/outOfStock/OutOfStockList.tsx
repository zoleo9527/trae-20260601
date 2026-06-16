import { useState, useEffect } from 'react';
import { Plus, Check, X, Eye, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import type { OutOfStockRecord, User } from '@/types';
import { outOfStockApi, storesApi, dishesApi } from '@/api';
import Modal from '@/components/common/Modal';

interface OutOfStockListProps {
  currentUser: User;
}

const statusConfig = {
  pending: { label: '待审核', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { label: '已确认', color: 'bg-blue-100 text-blue-800', icon: Check },
  rejected: { label: '已驳回', color: 'bg-red-100 text-red-800', icon: X },
  replenished: { label: '已补货', color: 'bg-green-100 text-green-800', icon: Check },
  closed: { label: '已关闭', color: 'bg-gray-100 text-gray-600', icon: Check },
};

const reasons = ['原材料短缺', '供应商延迟', '销量超出预期', '原材料质量问题', '其他'];

export default function OutOfStockList({ currentUser }: OutOfStockListProps) {
  const [records, setRecords] = useState<OutOfStockRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showExceptionDrawer, setShowExceptionDrawer] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<OutOfStockRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [stores, setStores] = useState<{ id: string; name: string; region: string }[]>([]);
  const [dishes, setDishes] = useState<{ id: string; name: string; category: string; unit: string; stock: number }[]>([]);
  const [formData, setFormData] = useState({
    dishId: '',
    storeId: '',
    quantity: '',
    reason: '',
    remark: '',
  });

  useEffect(() => {
    loadRecords();
    loadStores();
    loadDishes();
  }, []);

  const loadRecords = async () => {
    setLoading(true);
    const data = await outOfStockApi.list();
    setRecords(data);
    setLoading(false);
  };

  const loadStores = async () => {
    const data = await storesApi.list();
    setStores(data);
  };

  const loadDishes = async () => {
    const data = await dishesApi.list();
    setDishes(data);
  };

  const handleCreate = async () => {
    if (!formData.dishId || !formData.storeId || !formData.quantity || !formData.reason) return;
    
    const dish = dishes.find(d => d.id === formData.dishId);
    const store = stores.find(s => s.id === formData.storeId);
    if (!dish || !store) return;
    
    await outOfStockApi.create({
      dishId: formData.dishId,
      dishName: dish.name,
      storeId: store.id,
      storeName: store.name,
      region: store.region,
      quantity: Number(formData.quantity),
      reason: formData.reason,
      remark: formData.remark,
      submitterId: currentUser.id,
      submitterName: currentUser.name,
    });
    
    setShowCreateModal(false);
    setFormData({ dishId: '', storeId: '', quantity: '', reason: '', remark: '' });
    loadRecords();
  };

  const handleApprove = async (id: string) => {
    await outOfStockApi.approve(id, currentUser.id, currentUser.name);
    loadRecords();
  };

  const handleReject = async () => {
    if (!selectedRecord?.id || !rejectReason) return;
    await outOfStockApi.reject(selectedRecord.id, currentUser.id, currentUser.name, rejectReason);
    setShowRejectModal(false);
    setRejectReason('');
    loadRecords();
  };

  const handleClose = async (id: string) => {
    await outOfStockApi.close(id);
    loadRecords();
  };

  const handleOpenRejectModal = (record: OutOfStockRecord) => {
    setSelectedRecord(record);
    setShowRejectModal(true);
  };

  const handleOpenDetailModal = (record: OutOfStockRecord) => {
    setSelectedRecord(record);
    setShowDetailModal(true);
  };

  const handleOpenExceptionDrawer = (record: OutOfStockRecord) => {
    setSelectedRecord(record);
    setShowExceptionDrawer(true);
  };

  const canApprove = (record: OutOfStockRecord) => {
    return currentUser.role === 'supervisor' && record.status === 'pending';
  };

  const canReject = (record: OutOfStockRecord) => {
    return currentUser.role === 'supervisor' && record.status === 'pending';
  };

  const canClose = (record: OutOfStockRecord) => {
    return currentUser.role === 'manager' && record.status === 'replenished';
  };

  const canCreate = currentUser.role === 'manager';

  const managerStores = stores.filter(s => currentUser.storeName === s.name);
  const availableStores = currentUser.role === 'manager' ? managerStores : stores;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">菜品售罄处理</h2>
          <p className="text-sm text-gray-500">管理门店菜品售罄申请，跟踪处理进度</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>提交售罄申请</span>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">数量</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">原因</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">提交人</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">提交时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600 mx-auto"></div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">暂无售罄记录</td>
                </tr>
              ) : (
                records.map((record) => {
                  const StatusIcon = statusConfig[record.status].icon;
                  const hasException = record.status === 'rejected' || record.status === 'replenished';
                  return (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{record.dish_name || record.dishName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{record.store_name || record.storeName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{record.quantity}份</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{record.reason}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[record.status].color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[record.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{record.submitter_name || record.submitterName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">{record.submit_time || record.submitTime}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleOpenDetailModal(record)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="查看详情"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {hasException && (
                            <button
                              onClick={() => handleOpenExceptionDrawer(record)}
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="异常处理"
                            >
                              <AlertCircle className="w-4 h-4" />
                            </button>
                          )}
                          {canApprove(record) && (
                            <button
                              onClick={() => handleApprove(record.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="确认"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          {canReject(record) && (
                            <button
                              onClick={() => handleOpenRejectModal(record)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="驳回"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                          {canClose(record) && (
                            <button
                              onClick={() => handleClose(record.id)}
                              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                              title="关闭"
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

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="提交售罄申请">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">门店 *</label>
            <select
              value={formData.storeId}
              onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">请选择门店</option>
              {availableStores.map((store) => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">菜品名称 *</label>
            <select
              value={formData.dishId}
              onChange={(e) => setFormData({ ...formData, dishId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">请选择菜品</option>
              {dishes.map((dish) => (
                <option key={dish.id} value={dish.id}>
                  {dish.name} (库存: {dish.stock}{dish.unit})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">售罄数量 *</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="请输入售罄数量"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">售罄原因 *</label>
            <select
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">请选择原因</option>
              {reasons.map((reason) => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注说明</label>
            <textarea
              value={formData.remark}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows={3}
              placeholder="请输入备注信息（可用于临时补货参考）"
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
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              提交申请
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="售罄详情">
        {selectedRecord && (
          <div className="space-y-4">
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-800">{selectedRecord.dish_name || selectedRecord.dishName}</h3>
              <div className="flex items-center mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[selectedRecord.status].color}`}>
                  {statusConfig[selectedRecord.status].label}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">门店：</span>
                <span className="text-gray-800">{selectedRecord.store_name || selectedRecord.storeName}</span>
              </div>
              <div>
                <span className="text-gray-500">区域：</span>
                <span className="text-gray-800">{selectedRecord.region}</span>
              </div>
              <div>
                <span className="text-gray-500">售罄数量：</span>
                <span className="text-gray-800">{selectedRecord.quantity}份</span>
              </div>
              <div>
                <span className="text-gray-500">售罄原因：</span>
                <span className="text-gray-800">{selectedRecord.reason}</span>
              </div>
              <div>
                <span className="text-gray-500">提交人：</span>
                <span className="text-gray-800">{selectedRecord.submitter_name || selectedRecord.submitterName}</span>
              </div>
              <div>
                <span className="text-gray-500">提交时间：</span>
                <span className="text-gray-800">{selectedRecord.submit_time || selectedRecord.submitTime}</span>
              </div>
              {(selectedRecord.approver_name || selectedRecord.approverName) && (
                <>
                  <div>
                    <span className="text-gray-500">审核人：</span>
                    <span className="text-gray-800">{selectedRecord.approver_name || selectedRecord.approverName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">审核时间：</span>
                    <span className="text-gray-800">{selectedRecord.approve_time || selectedRecord.approveTime}</span>
                  </div>
                </>
              )}
            </div>
            {(selectedRecord.remark) && (
              <div>
                <span className="text-gray-500 block mb-1">备注说明：</span>
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{selectedRecord.remark}</p>
              </div>
            )}
            {(selectedRecord.reject_reason || selectedRecord.rejectReason) && (
              <div className="bg-red-50 p-3 rounded-lg">
                <span className="text-red-600 block mb-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  驳回原因
                </span>
                <p className="text-red-800">{selectedRecord.reject_reason || selectedRecord.rejectReason}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="驳回售罄申请">
        {selectedRecord && (
          <div className="space-y-4">
            <p className="text-gray-600">确定要驳回 <strong>{selectedRecord.dish_name || selectedRecord.dishName}</strong> 的售罄申请吗？</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">驳回原因 *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={3}
                placeholder="请输入驳回原因（将记录在系统中）"
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                确认驳回
              </button>
            </div>
          </div>
        )}
      </Modal>

      <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl transform transition-transform z-50 ${showExceptionDrawer ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">异常处理</h2>
          <button
            onClick={() => setShowExceptionDrawer(false)}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        {selectedRecord && (
          <div className="p-4 overflow-y-auto" style={{ height: 'calc(100% - 64px)' }}>
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">基础信息</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">菜品名称</span>
                    <span className="text-gray-800">{selectedRecord.dish_name || selectedRecord.dishName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">门店</span>
                    <span className="text-gray-800">{selectedRecord.store_name || selectedRecord.storeName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">状态</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[selectedRecord.status].color}`}>
                      {statusConfig[selectedRecord.status].label}
                    </span>
                  </div>
                </div>
              </div>

              {(selectedRecord.status === 'rejected') && (
                <div className="bg-red-50 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 mb-2 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    驳回原因
                  </h3>
                  <p className="text-red-700 text-sm">{selectedRecord.reject_reason || selectedRecord.rejectReason}</p>
                </div>
              )}

              {(selectedRecord.status === 'replenished') && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2 flex items-center">
                    <Check className="w-4 h-4 mr-2" />
                    补货完成
                  </h3>
                  <p className="text-green-700 text-sm">该菜品已完成临时补货，可选择关闭记录</p>
                  {canClose(selectedRecord) && (
                    <button
                      onClick={() => {
                        handleClose(selectedRecord.id);
                        setShowExceptionDrawer(false);
                      }}
                      className="mt-3 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      关闭记录
                    </button>
                  )}
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">状态流转</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">提交售罄申请</p>
                      <p className="text-sm text-gray-500">{selectedRecord.submit_time || selectedRecord.submitTime}</p>
                      <p className="text-sm text-gray-500">{selectedRecord.submitter_name || selectedRecord.submitterName}</p>
                    </div>
                  </div>
                  {(selectedRecord.approve_time || selectedRecord.approveTime) && (
                    <div className="flex items-start space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${selectedRecord.status === 'rejected' ? 'bg-red-500' : 'bg-blue-500'}`}>
                        {selectedRecord.status === 'rejected' ? <X className="w-4 h-4 text-white" /> : <Check className="w-4 h-4 text-white" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{selectedRecord.status === 'rejected' ? '驳回申请' : '确认售罄'}</p>
                        <p className="text-sm text-gray-500">{selectedRecord.approve_time || selectedRecord.approveTime}</p>
                        <p className="text-sm text-gray-500">{selectedRecord.approver_name || selectedRecord.approverName}</p>
                      </div>
                    </div>
                  )}
                  {selectedRecord.status === 'replenished' && (
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">补货完成</p>
                        <p className="text-sm text-gray-500">等待关闭</p>
                      </div>
                    </div>
                  )}
                  {selectedRecord.close_time && (
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center flex-shrink-0">
                        <X className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">记录关闭</p>
                        <p className="text-sm text-gray-500">{selectedRecord.close_time}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">备注信息</h3>
                <p className="text-gray-600 text-sm bg-white p-3 rounded-lg">{selectedRecord.remark || '暂无备注'}</p>
              </div>

              <button
                onClick={() => setShowExceptionDrawer(false)}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
              >
                <ChevronRight className="w-4 h-4" />
                <span>返回列表</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
