import { useEffect, useState } from 'react';
import { Search, AlertTriangle, Package, Plus, Edit2, Trash2, X } from 'lucide-react';
import { useWorkOrderStore } from '@/stores/workorder';
import type { Part } from '@/types';

export function PartsManagement() {
  const { parts, fetchParts, addPart, updatePart, deletePart, isPartUsed } = useWorkOrderStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newPart, setNewPart] = useState<Omit<Part, 'id'>>({
    partNo: '',
    name: '',
    specification: '',
    stock: 0,
    minStock: 0,
    price: 0,
  });
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [deletingPart, setDeletingPart] = useState<Part | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  const filteredParts = parts.filter(p => 
    p.partNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.specification.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockParts = parts.filter(p => p.stock <= p.minStock);

  const handleAddPart = () => {
    if (newPart.partNo && newPart.name) {
      addPart(newPart);
      setShowAddModal(false);
      setNewPart({
        partNo: '',
        name: '',
        specification: '',
        stock: 0,
        minStock: 0,
        price: 0,
      });
    }
  };

  const handleEditPart = () => {
    if (editingPart) {
      updatePart(editingPart.id, editingPart);
      setShowEditModal(false);
      setEditingPart(null);
    }
  };

  const handleDeletePart = () => {
    if (deletingPart) {
      deletePart(deletingPart.id);
      setShowDeleteConfirm(false);
      setDeletingPart(null);
    }
  };

  const handleDeleteClick = (part: Part) => {
    if (isPartUsed(part.id)) {
      setErrorMessage(`配件 "${part.name}" 正在被工单引用，无法删除。`);
      setTimeout(() => setErrorMessage(''), 3000);
    } else {
      setDeletingPart(part);
      setShowDeleteConfirm(true);
    }
  };

  const openEditModal = (part: Part) => {
    setEditingPart({ ...part });
    setShowEditModal(true);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">配件管理</h1>
          <p className="text-sm text-slate-500">管理配件库存</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus size={18} />
          新增配件
        </button>
      </div>

      {errorMessage && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-600" />
            <span className="text-red-800">{errorMessage}</span>
          </div>
        </div>
      )}

      {lowStockParts.length > 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={20} className="text-yellow-600" />
            <span className="font-medium text-yellow-800">库存预警</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockParts.map(p => (
              <span key={p.id} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                {p.name} (库存: {p.stock})
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索配件编号、名称或规格..."
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-4 px-4 text-sm font-medium text-slate-600">配件编号</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-slate-600">配件名称</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-slate-600">规格型号</th>
                <th className="text-center py-4 px-4 text-sm font-medium text-slate-600">库存数量</th>
                <th className="text-center py-4 px-4 text-sm font-medium text-slate-600">最低库存</th>
                <th className="text-right py-4 px-4 text-sm font-medium text-slate-600">单价 (元)</th>
                <th className="text-center py-4 px-4 text-sm font-medium text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredParts.map((part) => (
                <tr key={part.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4 text-sm text-slate-800 font-medium">{part.partNo}</td>
                  <td className="py-4 px-4 text-sm text-slate-800">{part.name}</td>
                  <td className="py-4 px-4 text-sm text-slate-800">{part.specification}</td>
                  <td className={`py-4 px-4 text-sm text-center font-medium ${
                    part.stock <= part.minStock ? 'text-red-600' : 'text-slate-800'
                  }`}>
                    {part.stock}
                  </td>
                  <td className="py-4 px-4 text-sm text-center text-slate-800">{part.minStock}</td>
                  <td className="py-4 px-4 text-sm text-right text-slate-800">{part.price.toFixed(2)}</td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => openEditModal(part)}
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(part)}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[500px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Plus size={20} />
                新增配件
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">配件编号</label>
                <input
                  type="text"
                  value={newPart.partNo}
                  onChange={(e) => setNewPart(prev => ({ ...prev, partNo: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="P-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">配件名称</label>
                <input
                  type="text"
                  value={newPart.name}
                  onChange={(e) => setNewPart(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="液压油滤芯"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">规格型号</label>
                <input
                  type="text"
                  value={newPart.specification}
                  onChange={(e) => setNewPart(prev => ({ ...prev, specification: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="HF35000"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">库存</label>
                  <input
                    type="number"
                    value={newPart.stock}
                    onChange={(e) => setNewPart(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">最低库存</label>
                  <input
                    type="number"
                    value={newPart.minStock}
                    onChange={(e) => setNewPart(prev => ({ ...prev, minStock: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">单价</label>
                  <input
                    type="number"
                    value={newPart.price}
                    onChange={(e) => setNewPart(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleAddPart}
                disabled={!newPart.partNo || !newPart.name}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingPart && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[500px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Edit2 size={20} />
                编辑配件
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">配件编号</label>
                <input
                  type="text"
                  value={editingPart.partNo}
                  onChange={(e) => setEditingPart(prev => prev ? { ...prev, partNo: e.target.value } : null)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="P-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">配件名称</label>
                <input
                  type="text"
                  value={editingPart.name}
                  onChange={(e) => setEditingPart(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="液压油滤芯"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">规格型号</label>
                <input
                  type="text"
                  value={editingPart.specification}
                  onChange={(e) => setEditingPart(prev => prev ? { ...prev, specification: e.target.value } : null)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="HF35000"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">库存</label>
                  <input
                    type="number"
                    value={editingPart.stock}
                    onChange={(e) => setEditingPart(prev => prev ? { ...prev, stock: parseInt(e.target.value) || 0 } : null)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">最低库存</label>
                  <input
                    type="number"
                    value={editingPart.minStock}
                    onChange={(e) => setEditingPart(prev => prev ? { ...prev, minStock: parseInt(e.target.value) || 0 } : null)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">单价</label>
                  <input
                    type="number"
                    value={editingPart.price}
                    onChange={(e) => setEditingPart(prev => prev ? { ...prev, price: parseFloat(e.target.value) || 0 } : null)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleEditPart}
                disabled={!editingPart.partNo || !editingPart.name}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认修改
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && deletingPart && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[400px]">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">确认删除</h3>
            <p className="text-slate-600 mb-6">
              确定要删除配件 <span className="font-medium">{deletingPart.name}</span> 吗？此操作不可撤销。
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleDeletePart}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
