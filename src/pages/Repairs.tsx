import { useState } from 'react';
import { Plus, Building2, Clock, CheckCircle2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatCurrency, repairStatusNames } from '../data/mockData';
import type { RepairStatus } from '../../shared/types';

export default function Repairs() {
  const { currentRole, currentLandlordId, repairs, properties, addRepair } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newRepair, setNewRepair] = useState({
    propertyId: '',
    title: '',
    description: '',
    cost: '',
    date: new Date().toISOString().split('T')[0],
    status: 'pending' as RepairStatus,
  });

  const filteredProperties = currentRole === 'landlord'
    ? properties.filter((p) => p.landlordId === currentLandlordId)
    : properties;

  const propertyIds = filteredProperties.map((p) => p.id);
  const filteredRepairs = repairs.filter((r) => propertyIds.includes(r.propertyId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addRepair({
        ...newRepair,
        cost: Number(newRepair.cost),
        createdBy: '运营小王',
      });
      setShowModal(false);
      setNewRepair({
        propertyId: '',
        title: '',
        description: '',
        cost: '',
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">维修工单</h1>
          <p className="text-slate-500 mt-1">共 {filteredRepairs.length} 条维修记录</p>
        </div>
        {currentRole !== 'landlord' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus size={18} />
            <span>新增维修</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {filteredRepairs.map((repair) => {
          const property = properties.find((p) => p.id === repair.propertyId);

          return (
            <div key={repair.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900">{repair.title}</h3>
                  <div className="flex items-center gap-2 mt-1 text-slate-500 text-sm">
                    <Building2 size={14} />
                    <span>{property?.name}</span>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  repair.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                  repair.status === 'in_progress' ? 'bg-amber-50 text-amber-600' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {repair.status === 'completed' ? <CheckCircle2 size={12} className="inline mr-1" /> :
                   repair.status === 'in_progress' ? <Clock size={12} className="inline mr-1" /> : null}
                  {repairStatusNames[repair.status]}
                </span>
              </div>

              <p className="text-slate-600 text-sm mb-4">{repair.description}</p>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="text-sm">
                  <span className="text-slate-500">费用：</span>
                  <span className="font-medium text-rose-600">-{formatCurrency(repair.cost)}</span>
                </div>
                <div className="text-sm text-slate-500">
                  {repair.date}
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-400">
                录入人：{repair.createdBy}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">新增维修工单</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">房源</label>
                <select
                  value={newRepair.propertyId}
                  onChange={(e) => setNewRepair({ ...newRepair, propertyId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                >
                  <option value="">请选择房源</option>
                  {filteredProperties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">标题</label>
                <input
                  type="text"
                  value={newRepair.title}
                  onChange={(e) => setNewRepair({ ...newRepair, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="如：门锁更换"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">描述</label>
                <textarea
                  value={newRepair.description}
                  onChange={(e) => setNewRepair({ ...newRepair, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="详细描述维修内容"
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">费用</label>
                  <input
                    type="number"
                    value={newRepair.cost}
                    onChange={(e) => setNewRepair({ ...newRepair, cost: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">日期</label>
                  <input
                    type="date"
                    value={newRepair.date}
                    onChange={(e) => setNewRepair({ ...newRepair, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">状态</label>
                <select
                  value={newRepair.status}
                  onChange={(e) => setNewRepair({ ...newRepair, status: e.target.value as RepairStatus })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="pending">待处理</option>
                  <option value="in_progress">进行中</option>
                  <option value="completed">已完成</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  disabled={submitting}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? '提交中...' : '确认添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
