import { useState } from 'react';
import { Plus, CheckCircle, XCircle, Clock, User, AlertTriangle } from 'lucide-react';
import { useStore } from '@/store/store';
import type { SoldOut } from '@/types';

export const SoldOutManagement = () => {
  const { soldOuts, confirmSoldOut, resolveSoldOut, reportSoldOut } = useStore();
  const [selectedItem, setSelectedItem] = useState<SoldOut | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSoldOut, setNewSoldOut] = useState({
    itemName: '',
    category: 'dish' as SoldOut['category'],
    reason: '',
    notes: '',
  });
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'resolved'>('all');

  const filteredItems = soldOuts.filter(item => {
    if (filterStatus === 'all') return true;
    return item.status === filterStatus;
  });

  const getStatusColor = (status: SoldOut['status']) => {
    return status === 'active' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';
  };

  const getStatusLabel = (status: SoldOut['status']) => {
    return status === 'active' ? '沽清中' : '已解决';
  };

  const getCategoryLabel = (category: SoldOut['category']) => {
    switch (category) {
      case 'soupBase': return '锅底';
      case 'dish': return '菜品';
      case 'drink': return '饮品';
    }
  };

  const getCategoryColor = (category: SoldOut['category']) => {
    switch (category) {
      case 'soupBase': return 'bg-orange-100 text-orange-700';
      case 'dish': return 'bg-blue-100 text-blue-700';
      case 'drink': return 'bg-purple-100 text-purple-700';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'reported': return '报告';
      case 'confirmed': return '确认';
      case 'resolved': return '解决';
      case 'updated': return '更新';
      default: return action;
    }
  };

  const handleCreate = () => {
    if (newSoldOut.itemName && newSoldOut.reason) {
      reportSoldOut({
        itemName: newSoldOut.itemName,
        category: newSoldOut.category,
        reason: newSoldOut.reason,
        notes: newSoldOut.notes,
      });
      setShowCreateModal(false);
      setNewSoldOut({ itemName: '', category: 'dish', reason: '', notes: '' });
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">沽清提醒</h2>
          <p className="text-gray-500 mt-1">实时跟踪沽清商品，快速处理库存问题</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          报告沽清
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {(['all', 'active', 'resolved'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === status
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? '全部' : status === 'active' ? '沽清中' : '已解决'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`bg-white rounded-xl shadow-sm border transition-all cursor-pointer ${
              item.status === 'active' ? 'border-red-200 hover:border-red-300' : 'border-gray-100'
            }`}
            onClick={() => { setSelectedItem(item); setShowDetailModal(true); }}
          >
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-5 w-5 ${item.status === 'active' ? 'text-red-500' : 'text-green-500'}`} />
                  <h3 className="font-semibold text-gray-800">{item.itemName}</h3>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                  {getStatusLabel(item.status)}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <span className={`px-2 py-0.5 rounded-full text-xs ${getCategoryColor(item.category)}`}>
                  {getCategoryLabel(item.category)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatTime(item.reportedAt)}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {item.reportedBy}
                </span>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-gray-500 text-sm">原因：</span>
                <span className="text-gray-700 text-sm flex-1">{item.reason}</span>
              </div>

              {item.notes && (
                <div className="flex items-start gap-2 mt-2">
                  <span className="text-gray-500 text-sm">备注：</span>
                  <span className="text-gray-600 text-sm flex-1">{item.notes}</span>
                </div>
              )}

              {item.refundReason && (
                <div className="flex items-start gap-2 mt-2">
                  <span className="text-gray-500 text-sm">退回原因：</span>
                  <span className="text-orange-600 text-sm flex-1">{item.refundReason}</span>
                </div>
              )}

              {item.supplementNotes && (
                <div className="flex items-start gap-2 mt-2">
                  <span className="text-gray-500 text-sm">补充备注：</span>
                  <span className="text-blue-600 text-sm flex-1">{item.supplementNotes}</span>
                </div>
              )}

              {item.status === 'active' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); confirmSoldOut(item.id); }}
                      className="flex-1 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-200 transition-colors"
                    >
                      确认通知
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); resolveSoldOut(item.id); }}
                      className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                    >
                      标记解决
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className={`h-6 w-6 ${selectedItem.status === 'active' ? 'text-red-500' : 'text-green-500'}`} />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{selectedItem.itemName}</h3>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getStatusColor(selectedItem.status)}`}>
                    {getStatusLabel(selectedItem.status)}
                  </span>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600">
                <span className="text-xl">&times;</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">类别</p>
                    <p className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs mt-1 ${getCategoryColor(selectedItem.category)}`}>
                      {getCategoryLabel(selectedItem.category)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">报告人</p>
                    <p className="font-medium text-gray-800 mt-1">{selectedItem.reportedBy}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">报告时间</p>
                    <p className="font-medium text-gray-800 mt-1">{formatTime(selectedItem.reportedAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">解决人</p>
                    <p className="font-medium text-gray-800 mt-1">{selectedItem.resolvedBy || '-'}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">沽清原因</p>
                <p className="text-gray-800 bg-gray-50 rounded-lg p-3">{selectedItem.reason}</p>
              </div>

              {selectedItem.refundReason && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">退回原因</p>
                  <p className="text-orange-600 bg-orange-50 rounded-lg p-3">{selectedItem.refundReason}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600 mb-2">备注信息</p>
                <p className="text-gray-800 bg-gray-50 rounded-lg p-3">{selectedItem.notes || '无'}</p>
              </div>

              {selectedItem.supplementNotes && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">补充备注</p>
                  <p className="text-blue-600 bg-blue-50 rounded-lg p-3">{selectedItem.supplementNotes}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600 mb-3">处理历史</p>
                <div className="space-y-2">
                  {selectedItem.history.map((record, index) => (
                    <div key={record.id || index} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        record.action === 'reported' ? 'bg-red-100' :
                        record.action === 'confirmed' ? 'bg-yellow-100' :
                        record.action === 'resolved' ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {record.action === 'resolved' && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {record.action === 'reported' && <XCircle className="h-4 w-4 text-red-600" />}
                        {record.action === 'confirmed' && <CheckCircle className="h-4 w-4 text-yellow-600" />}
                        {record.action === 'updated' && <Clock className="h-4 w-4 text-gray-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{getActionLabel(record.action)} - {record.description}</p>
                        <p className="text-xs text-gray-500">{record.actor} · {formatTime(record.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedItem.status === 'active' && (
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => { confirmSoldOut(selectedItem.id); setShowDetailModal(false); }}
                    className="flex-1 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg font-medium hover:bg-yellow-200 transition-colors"
                  >
                    确认通知
                  </button>
                  <button
                    onClick={() => { resolveSoldOut(selectedItem.id); setShowDetailModal(false); }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    标记解决
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">报告沽清</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <span className="text-xl">&times;</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">商品名称</label>
                <input
                  type="text"
                  value={newSoldOut.itemName}
                  onChange={(e) => setNewSoldOut({ ...newSoldOut, itemName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="输入商品名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">类别</label>
                <select
                  value={newSoldOut.category}
                  onChange={(e) => setNewSoldOut({ ...newSoldOut, category: e.target.value as SoldOut['category'] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="dish">菜品</option>
                  <option value="soupBase">锅底</option>
                  <option value="drink">饮品</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">沽清原因</label>
                <textarea
                  value={newSoldOut.reason}
                  onChange={(e) => setNewSoldOut({ ...newSoldOut, reason: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  placeholder="输入沽清原因"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">备注信息</label>
                <textarea
                  value={newSoldOut.notes}
                  onChange={(e) => setNewSoldOut({ ...newSoldOut, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={2}
                  placeholder="输入备注信息（可选）"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newSoldOut.itemName || !newSoldOut.reason}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  提交报告
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
