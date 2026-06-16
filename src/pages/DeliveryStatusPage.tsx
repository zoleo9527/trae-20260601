import { useState } from 'react';
import { Search, Filter, Eye, Check, X, Truck, Calendar, Package, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/useStore';
import { statusLabels } from '../data/mockData';
import { StockRequest } from '../types';

export default function DeliveryStatusPage() {
  const { stockRequests, updateRequestStatus, currentUser, users } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<StockRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [comment, setComment] = useState('');
  const [confirmedQty, setConfirmedQty] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'deliver' | 'confirm'>('approve');

  const filteredRequests = stockRequests.filter(request => {
    const matchesSearch = request.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.store.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    delivering: 'bg-orange-100 text-orange-800',
    delivered: 'bg-purple-100 text-purple-800',
    inspected: 'bg-green-100 text-green-800',
  };

  const canApprove = currentUser.role === 'supervisor';
  const canDeliver = currentUser.role === 'purchaser';

  const handleAction = () => {
    if (!selectedRequest) return;
    
    switch (actionType) {
      case 'approve':
        updateRequestStatus(selectedRequest.id, 'approved', comment, confirmedQty ? Number(confirmedQty) : undefined);
        break;
      case 'reject':
        updateRequestStatus(selectedRequest.id, 'rejected', comment);
        break;
      case 'deliver':
        updateRequestStatus(selectedRequest.id, 'delivering');
        break;
      case 'confirm':
        updateRequestStatus(selectedRequest.id, 'delivered');
        break;
    }
    
    setShowModal(false);
    setSelectedRequest(null);
    setComment('');
    setConfirmedQty('');
  };

  const openModal = (request: StockRequest, action: 'approve' | 'reject' | 'deliver' | 'confirm') => {
    setSelectedRequest(request);
    setActionType(action);
    setShowModal(true);
    setComment('');
    setConfirmedQty(request.requestQty.toString());
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">配货状态</h2>
          <p className="text-gray-500 mt-1">查看缺货申领单的审核和配货进度</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索商品或门店..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-6 py-2 border border-gray-300 rounded-lg appearance-none bg-white"
            >
              <option value="all">全部状态</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">申领单号</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">门店</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">商品</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">申领数量</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">可配数量</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">影响营业</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">期望日期</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRequests.map(request => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-primary-600">#{String(request.id).padStart(6, '0')}</td>
                  <td className="px-6 py-4 text-gray-900">{request.store.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Package className="w-4 h-4 mr-2 text-primary-500" />
                      <span>{request.product.name} ({request.product.spec})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{request.requestQty} {request.product.unit}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {request.confirmedQty !== null ? (
                      <span className="font-medium text-green-600">{request.confirmedQty} {request.product.unit}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {request.affectsBusiness ? (
                      <span className="flex items-center text-orange-600">
                        <AlertCircle className="w-4 h-4 mr-1" /> 是
                      </span>
                    ) : (
                      <span className="text-gray-400">否</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      {request.expectedDate}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[request.status]}`}>
                      {statusLabels[request.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {request.status === 'pending' && canApprove && (
                        <>
                          <button
                            onClick={() => openModal(request, 'approve')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="审核通过"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openModal(request, 'reject')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="驳回"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {request.status === 'approved' && canDeliver && (
                        <button
                          onClick={() => openModal(request, 'deliver')}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                          title="开始配货"
                        >
                          <Truck className="w-4 h-4" />
                        </button>
                      )}
                      {request.status === 'delivering' && canDeliver && (
                        <button
                          onClick={() => openModal(request, 'confirm')}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                          title="确认发货"
                        >
                          <Check className="w-4 h-4" />
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

      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedRequest(null)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">申领单详情</h3>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500">门店</span>
                <span className="font-medium">{stockRequests.find(r => r.id === selectedRequest.id)?.store.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">商品</span>
                <span className="font-medium">{stockRequests.find(r => r.id === selectedRequest.id)?.product.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">规格</span>
                <span>{stockRequests.find(r => r.id === selectedRequest.id)?.product.spec}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">申领数量</span>
                <span>{selectedRequest.requestQty} {stockRequests.find(r => r.id === selectedRequest.id)?.product.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">可配数量</span>
                <span>{selectedRequest.confirmedQty ?? '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">影响营业</span>
                <span>{selectedRequest.affectsBusiness ? '是' : '否'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">缺货原因</span>
                <span>{selectedRequest.reason}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">申请人</span>
                <span>{users.find(u => u.id === selectedRequest.userId)?.name}</span>
              </div>
              {selectedRequest.supervisorComment && (
                <div>
                  <span className="text-gray-500">审核意见</span>
                  <p className="mt-1 text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedRequest.supervisorComment}</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedRequest(null)}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {actionType === 'approve' && '审核通过'}
              {actionType === 'reject' && '驳回申请'}
              {actionType === 'deliver' && '开始配货'}
              {actionType === 'confirm' && '确认发货'}
            </h3>
            {(actionType === 'approve') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">可配数量</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    max={selectedRequest.requestQty}
                    value={confirmedQty}
                    onChange={(e) => setConfirmedQty(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <span className="ml-2 text-gray-500">{stockRequests.find(r => r.id === selectedRequest.id)?.product.unit}</span>
                </div>
              </div>
            )}
            {(actionType === 'approve' || actionType === 'reject') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">备注</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={actionType === 'reject' ? '请说明驳回原因...' : '请输入审核意见...'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>
            )}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleAction}
                className={`px-4 py-2 text-white rounded-lg ${
                  actionType === 'reject'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
