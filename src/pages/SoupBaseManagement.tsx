import { useState } from 'react';
import { Plus, Edit2, CheckCircle, AlertCircle, Loader, TrendingUp } from 'lucide-react';
import { useStore } from '@/store/store';
import type { SoupBase } from '@/types';

export const SoupBaseManagement = () => {
  const { soupBases, completePrepareSoupBase, updateSoupBase } = useStore();
  const [selectedItem, setSelectedItem] = useState<SoupBase | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [prepareQuantity, setPrepareQuantity] = useState(5);
  const [editingNotes, setEditingNotes] = useState('');

  const getStatusColor = (status: SoupBase['status']) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-700';
      case 'preparing': return 'bg-yellow-100 text-yellow-700';
      case 'ready': return 'bg-green-100 text-green-700';
      case 'delivered': return 'bg-blue-100 text-blue-700';
    }
  };

  const getStatusLabel = (status: SoupBase['status']) => {
    switch (status) {
      case 'pending': return '待准备';
      case 'preparing': return '准备中';
      case 'ready': return '已就绪';
      case 'delivered': return '已送达';
    }
  };

  const getStockColor = (stock: number, minStock: number) => {
    if (stock <= 0) return 'text-red-600';
    if (stock <= minStock) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getTypeLabel = (type: SoupBase['type']) => {
    switch (type) {
      case 'spicy': return '麻辣';
      case 'mild': return '清淡';
      case 'tomato': return '番茄';
      case 'bone': return '骨汤';
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

  const handlePrepare = (item: SoupBase) => {
    setSelectedItem(item);
    setShowModal(true);
    setPrepareQuantity(Math.max(1, item.minStock - item.stock + 5));
  };

  const handleCompletePrepare = () => {
    if (selectedItem) {
      completePrepareSoupBase(selectedItem.id, prepareQuantity);
      setShowModal(false);
      setSelectedItem(null);
    }
  };

  const handleSaveNotes = (item: SoupBase) => {
    if (editingNotes.trim()) {
      updateSoupBase(item.id, { notes: editingNotes });
      setEditingNotes('');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">锅底备料管理</h2>
          <p className="text-gray-500 mt-1">实时监控锅底库存状态，及时补充备料</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          <Plus className="h-5 w-5" />
          新增锅底
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">锅底名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">当前库存</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最低库存</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">责任人</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最近准备</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">备注</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {soupBases.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{item.name}</span>
                      {item.stock <= item.minStock && (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{getTypeLabel(item.type)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${getStockColor(item.stock, item.minStock)}`}>
                        {item.stock} {item.unit}
                      </span>
                      {item.stock <= item.minStock && (
                        <TrendingUp className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{item.minStock} {item.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status === 'preparing' && <Loader className="h-3 w-3 animate-spin" />}
                      {item.status === 'ready' && <CheckCircle className="h-3 w-3" />}
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{item.responsiblePerson}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">{formatTime(item.lastPreparedAt)}</td>
                  <td className="px-6 py-4">
                    {editingNotes ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingNotes}
                          onChange={(e) => setEditingNotes(e.target.value)}
                          className="px-2 py-1 text-sm border rounded"
                          placeholder="输入备注"
                        />
                        <button onClick={() => handleSaveNotes(item)} className="text-green-600 hover:text-green-700">
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 truncate max-w-[150px]" title={item.notes}>
                          {item.notes || '-'}
                        </span>
                        <button
                          onClick={() => setEditingNotes(item.notes)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.status !== 'preparing' ? (
                      <button
                        onClick={() => handlePrepare(item)}
                        className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 transition-colors"
                      >
                        开始备料
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePrepare(item)}
                        className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                      >
                        完成备料
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {selectedItem.status === 'preparing' ? '完成备料' : '开始备料'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <span className="text-xl">&times;</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">锅底名称</p>
                <p className="font-medium text-gray-800">{selectedItem.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">当前库存</p>
                  <p className={`font-medium ${getStockColor(selectedItem.stock, selectedItem.minStock)}`}>
                    {selectedItem.stock} {selectedItem.unit}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">最低库存</p>
                  <p className="font-medium text-gray-800">{selectedItem.minStock} {selectedItem.unit}</p>
                </div>
              </div>

              {selectedItem.status === 'preparing' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                   准备数量（{selectedItem.unit}）
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={prepareQuantity}
                    onChange={(e) => setPrepareQuantity(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCompletePrepare}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {selectedItem.status === 'preparing' ? '确认完成' : '开始准备'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
