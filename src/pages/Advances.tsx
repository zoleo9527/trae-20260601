import { useState } from 'react';
import { Plus, Building2, Wrench, Link2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../data/mockData';

export default function Advances() {
  const { currentRole, currentLandlordId, advances, properties, repairs, addAdvance } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [newAdvance, setNewAdvance] = useState({
    propertyId: '',
    repairId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const filteredProperties = currentRole === 'landlord'
    ? properties.filter((p) => p.landlordId === currentLandlordId)
    : properties;

  const propertyIds = filteredProperties.map((p) => p.id);
  const filteredAdvances = advances.filter((a) => propertyIds.includes(a.propertyId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addAdvance({
        ...newAdvance,
        amount: Number(newAdvance.amount),
        repairId: newAdvance.repairId || undefined,
        createdBy: '运营小王',
      });
      setShowModal(false);
      setNewAdvance({
        propertyId: '',
        repairId: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        reason: '',
      });
    } catch (error) {
      console.error('Failed to add advance:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPropertyRepairs = repairs.filter((r) => r.propertyId === newAdvance.propertyId);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">垫付记录</h1>
          <p className="text-slate-500 mt-1">共 {filteredAdvances.length} 条垫付记录</p>
        </div>
        {currentRole !== 'landlord' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus size={18} />
            <span>新增垫付</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm">垫付总金额</p>
          <p className="text-2xl font-bold text-purple-600 mt-2">
            {formatCurrency(filteredAdvances.reduce((sum, a) => sum + a.amount, 0))}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm">关联维修</p>
          <p className="text-2xl font-bold text-amber-600 mt-2">
            {filteredAdvances.filter((a) => a.repairId).length} 笔
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm">待结算</p>
          <p className="text-2xl font-bold text-rose-600 mt-2">
            {formatCurrency(
              filteredAdvances.reduce((sum, a) => sum + a.amount, 0) -
              advances.reduce((sum, a) => {
                const bill = useStore.getState().bills.find((b) => b.propertyId === a.propertyId);
                return sum + (bill?.status === 'settled' ? a.amount : 0);
              }, 0)
            )}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-slate-500 text-sm">
                <th className="px-6 py-4 font-medium">日期</th>
                <th className="px-6 py-4 font-medium">房源</th>
                <th className="px-6 py-4 font-medium">垫付原因</th>
                <th className="px-6 py-4 font-medium">关联维修</th>
                <th className="px-6 py-4 font-medium">金额</th>
                <th className="px-6 py-4 font-medium">录入人</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdvances.map((advance) => {
                const property = properties.find((p) => p.id === advance.propertyId);
                const repair = repairs.find((r) => r.id === advance.repairId);

                return (
                  <tr key={advance.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-600">{advance.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-slate-400" />
                        <span className="text-slate-900">{property?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{advance.reason}</td>
                    <td className="px-6 py-4">
                      {repair ? (
                        <div className="flex items-center gap-1 text-amber-600 text-sm">
                          <Link2 size={14} />
                          <span>{repair.title}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-purple-600">-{formatCurrency(advance.amount)}</td>
                    <td className="px-6 py-4 text-slate-500 text-sm">{advance.createdBy}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">新增垫付记录</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">房源</label>
                <select
                  value={newAdvance.propertyId}
                  onChange={(e) => setNewAdvance({ ...newAdvance, propertyId: e.target.value, repairId: '' })}
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
                <label className="block text-sm font-medium text-slate-700 mb-1">关联维修（可选）</label>
                <select
                  value={newAdvance.repairId}
                  onChange={(e) => setNewAdvance({ ...newAdvance, repairId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">不关联维修</option>
                  {selectedPropertyRepairs.map((r) => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">金额</label>
                <input
                  type="number"
                  value={newAdvance.amount}
                  onChange={(e) => setNewAdvance({ ...newAdvance, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="请输入金额"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">日期</label>
                <input
                  type="date"
                  value={newAdvance.date}
                  onChange={(e) => setNewAdvance({ ...newAdvance, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">垫付原因</label>
                <input
                  type="text"
                  value={newAdvance.reason}
                  onChange={(e) => setNewAdvance({ ...newAdvance, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="如：垫付维修费用"
                  required
                />
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
