import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck } from 'lucide-react';
import { useWorkOrderStore } from '@/stores/workorder';
import { useEquipmentStore } from '@/stores/equipment';
import { useAuthStore } from '@/stores/auth';
import type { Priority } from '@/types';
import { PRIORITY_MAP } from '@/types';

export function WorkOrderCreate() {
  const navigate = useNavigate();
  const { createWorkOrder } = useWorkOrderStore();
  const { equipment, fetchEquipment } = useEquipmentStore();
  const { getTechnicians } = useAuthStore();
  
  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);
  
  const [formData, setFormData] = useState({
    equipmentId: '',
    customerName: '',
    model: '',
    equipmentNo: '',
    faultDescription: '',
    priority: 'medium' as Priority,
    assignee: '',
    estimatedCompletionTime: '',
  });

  const technicians = getTechnicians();

  const handleEquipmentChange = (equipmentId: string) => {
    const eq = equipment.find(e => e.id === equipmentId);
    if (eq) {
      setFormData(prev => ({
        ...prev,
        equipmentId,
        equipmentNo: eq.equipmentNo,
        model: eq.model,
        customerName: eq.customerName,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createWorkOrder({
      equipmentId: formData.equipmentId,
      equipmentNo: formData.equipmentNo,
      customerName: formData.customerName,
      model: formData.model,
      faultDescription: formData.faultDescription,
      status: 'pending' as const,
      priority: formData.priority,
      assignee: formData.assignee,
      assigneeName: technicians.find(t => t.id === formData.assignee)?.name || '',
      estimatedCompletionTime: formData.estimatedCompletionTime,
      parts: [],
      maintenanceRecords: [],
    });
    navigate('/');
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-800">创建工单</h1>
          <p className="text-sm text-slate-500">填写工单信息</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <span className="flex items-center gap-2">
                <Truck size={16} />
                选择设备
              </span>
            </label>
            <select
              value={formData.equipmentId}
              onChange={(e) => handleEquipmentChange(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">请选择设备</option>
              {equipment.map(eq => (
                <option key={eq.id} value={eq.id}>
                  {eq.equipmentNo} - {eq.model} ({eq.customerName})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">客户名称</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">设备型号</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">故障描述</label>
            <textarea
              value={formData.faultDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, faultDescription: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-32"
              placeholder="请详细描述故障现象..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">优先级</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as Priority }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(PRIORITY_MAP).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">预计完成时间</label>
              <input
                type="datetime-local"
                value={formData.estimatedCompletionTime}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedCompletionTime: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">分配技师 (可选)</label>
            <select
              value={formData.assignee}
              onChange={(e) => setFormData(prev => ({ ...prev, assignee: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">暂不分配</option>
              {technicians.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <Link
            to="/"
            className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
          >
            取消
          </Link>
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            创建工单
          </button>
        </div>
      </form>
    </div>
  );
}
