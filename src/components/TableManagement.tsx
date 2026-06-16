import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Users, MapPin, CheckCircle } from 'lucide-react';
import { Table } from '../types';
import { tableApi } from '../api';
import { useStore } from '../store';

interface TableManagementProps {
  tables: Table[];
}

const statusConfig: Record<Table['status'], { label: string; color: string; bgColor: string }> = {
  available: { label: '空闲', color: 'text-green-600', bgColor: 'bg-green-100' },
  occupied: { label: '在用', color: 'text-red-600', bgColor: 'bg-red-100' },
  reserved: { label: '已预订', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  cleaning: { label: '清洁中', color: 'text-blue-600', bgColor: 'bg-blue-100' },
};

export const TableManagement: React.FC<TableManagementProps> = ({ tables }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [position, setPosition] = useState('');
  const [processing, setProcessing] = useState(false);

  const user = useStore((state) => state.user);
  const setTables = useStore((state) => state.setTables);

  const handleCreateTable = async () => {
    if (!name || !user) return;

    setProcessing(true);
    try {
      await tableApi.createTable(name, capacity, position, user.id);
      const updatedTables = await tableApi.getTables();
      setTables(updatedTables);
      setName('');
      setCapacity(4);
      setPosition('');
      setShowAddModal(false);
    } catch (err) {
      console.error('创建桌台失败:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateTable = async () => {
    if (!editingTable || !user) return;

    setProcessing(true);
    try {
      await tableApi.updateTable(editingTable.id, undefined, name, capacity, position, user.id);
      const updatedTables = await tableApi.getTables();
      setTables(updatedTables);
      setShowEditModal(false);
      setEditingTable(null);
    } catch (err) {
      console.error('更新桌台失败:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (!window.confirm('确定要删除这个桌台吗？')) return;

    setProcessing(true);
    try {
      await tableApi.deleteTable(id);
      const updatedTables = await tableApi.getTables();
      setTables(updatedTables);
    } catch (err) {
      console.error('删除桌台失败:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleStatusChange = async (tableId: string, status: Table['status']) => {
    if (!user) return;

    setProcessing(true);
    try {
      await tableApi.updateTable(tableId, status, undefined, undefined, undefined, user.id);
      const updatedTables = await tableApi.getTables();
      setTables(updatedTables);
    } catch (err) {
      console.error('更新桌台状态失败:', err);
    } finally {
      setProcessing(false);
    }
  };

  const openEditModal = (table: Table) => {
    setEditingTable(table);
    setName(table.name);
    setCapacity(table.capacity);
    setPosition(table.position);
    setShowEditModal(true);
  };

  const availableCount = tables.filter((t) => t.status === 'available').length;
  const occupiedCount = tables.filter((t) => t.status === 'occupied').length;
  const reservedCount = tables.filter((t) => t.status === 'reserved').length;
  const cleaningCount = tables.filter((t) => t.status === 'cleaning').length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">桌台管理</h2>
          <p className="text-sm text-gray-500">
            空闲: {availableCount} | 在用: {occupiedCount} | 预订: {reservedCount} | 清洁: {cleaningCount}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">新增桌台</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">桌台名称</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">容量</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">位置</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tables.map((table) => (
              <tr key={table.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-orange-600" />
                    </div>
                    <span className="font-medium text-gray-800">{table.name}</span>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="text-gray-600">{table.capacity}人桌</span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-1 text-gray-500">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{table.position || '-'}</span>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${statusConfig[table.status].bgColor} ${statusConfig[table.status].color}`}>
                      {statusConfig[table.status].label}
                    </span>
                    <select
                      value={table.status}
                      onChange={(e) => handleStatusChange(table.id, e.target.value as Table['status'])}
                      disabled={processing}
                      className="text-sm border border-gray-200 rounded px-2 py-1 focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="available">空闲</option>
                      <option value="occupied">在用</option>
                      <option value="reserved">已预订</option>
                      <option value="cleaning">清洁中</option>
                    </select>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditModal(table)}
                      disabled={processing}
                      className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all disabled:opacity-50"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTable(table.id)}
                      disabled={processing || table.status === 'occupied'}
                      className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">新增桌台</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">桌台名称 *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="如: A1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">容量 *</label>
                <select
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  {[2, 4, 6, 8, 10].map((num) => (
                    <option key={num} value={num}>{num}人桌</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">位置</label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="如: 一楼大厅左侧"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
              >
                取消
              </button>
              <button
                onClick={handleCreateTable}
                disabled={!name || processing}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all disabled:opacity-50"
              >
                {processing ? '添加中...' : '确认添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">编辑桌台</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">桌台名称 *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">容量 *</label>
                <select
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  {[2, 4, 6, 8, 10].map((num) => (
                    <option key={num} value={num}>{num}人桌</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">位置</label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTable(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
              >
                取消
              </button>
              <button
                onClick={handleUpdateTable}
                disabled={!name || processing}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all disabled:opacity-50"
              >
                {processing ? '更新中...' : '确认更新'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
