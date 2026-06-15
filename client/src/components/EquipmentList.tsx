import { useState } from 'react';
import { Plus, Search, Edit, Trash2, AlertTriangle, Activity, Wrench, X, Save } from 'lucide-react';
import { Equipment } from '../types';
import { equipmentAPI } from '../api';

interface EquipmentListProps {
  equipment: Equipment[];
  onUpdate: () => void;
}

export function EquipmentList({ equipment, onUpdate }: EquipmentListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Equipment>>({});

  const filteredEquipment = equipment.filter(e => 
    e.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setEditData({ ...equipment });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (selectedEquipment) {
      await equipmentAPI.update(selectedEquipment.id, editData);
      setIsEditing(false);
      setSelectedEquipment(null);
      onUpdate();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除该设备吗？')) {
      await equipmentAPI.delete(id);
      onUpdate();
    }
  };

  const handleStatusChange = async (id: string, status: Equipment['status']) => {
    await equipmentAPI.update(id, { status });
    onUpdate();
  };

  const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
    running: { label: '运行中', color: 'text-green-600', bg: 'bg-green-100' },
    warning: { label: '预警', color: 'text-yellow-600', bg: 'bg-yellow-100' },
    down: { label: '停机', color: 'text-red-600', bg: 'bg-red-100' },
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">设备档案</h1>
          <p className="text-gray-500 mt-1">管理叉车设备信息</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="搜索设备编号、客户名称..."
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">设备编号</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">型号/品牌</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">客户</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">运行时长</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">位置</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">状态</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">负责人</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">下次保养</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredEquipment.map(eq => (
                <tr key={eq.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-primary-600">{eq.code}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{eq.model} / {eq.brand}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{eq.customerName}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{eq.workingHours} 小时</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{eq.location}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusLabels[eq.status].bg} ${statusLabels[eq.status].color}`}>
                      {eq.status === 'running' && <Activity className="w-3 h-3" />}
                      {eq.status === 'warning' && <AlertTriangle className="w-3 h-3" />}
                      {eq.status === 'down' && <Wrench className="w-3 h-3" />}
                      {statusLabels[eq.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{eq.responsibleTechnician}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{eq.nextMaintenanceDate}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleEdit(eq)}
                      className="mr-2 text-primary-500 hover:text-primary-600"
                      title="编辑"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(eq.id)}
                      className="text-red-500 hover:text-red-600"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isEditing && selectedEquipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">编辑设备档案</h2>
              <button
                onClick={() => { setIsEditing(false); setSelectedEquipment(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">设备编号</label>
                <input
                  type="text"
                  value={editData.code || ''}
                  onChange={(e) => setEditData({ ...editData, code: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">型号</label>
                <input
                  type="text"
                  value={editData.model || ''}
                  onChange={(e) => setEditData({ ...editData, model: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">品牌</label>
                <input
                  type="text"
                  value={editData.brand || ''}
                  onChange={(e) => setEditData({ ...editData, brand: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">客户名称</label>
                <input
                  type="text"
                  value={editData.customerName || ''}
                  onChange={(e) => setEditData({ ...editData, customerName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">位置</label>
                <input
                  type="text"
                  value={editData.location || ''}
                  onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">负责技师</label>
                <input
                  type="text"
                  value={editData.responsibleTechnician || ''}
                  onChange={(e) => setEditData({ ...editData, responsibleTechnician: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">运行时长</label>
                <input
                  type="number"
                  value={editData.workingHours || 0}
                  onChange={(e) => setEditData({ ...editData, workingHours: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                <select
                  value={editData.status || 'running'}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value as Equipment['status'] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="running">运行中</option>
                  <option value="warning">预警</option>
                  <option value="down">停机</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setIsEditing(false); setSelectedEquipment(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
              >
                <Save className="w-4 h-4" />
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
