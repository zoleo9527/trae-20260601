import { useState } from 'react';
import { Plus, Building2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatCurrency, expenseTypeNames } from '../data/mockData';
import type { ExpenseType } from '../../shared/types';

export default function Expenses() {
  const { currentRole, currentLandlordId, expenses, properties, addExpense } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newExpense, setNewExpense] = useState({
    propertyId: '',
    type: 'cleaning' as ExpenseType,
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const filteredProperties = currentRole === 'landlord'
    ? properties.filter((p) => p.landlordId === currentLandlordId)
    : properties;

  const propertyIds = filteredProperties.map((p) => p.id);
  const filteredExpenses = expenses.filter((e) => propertyIds.includes(e.propertyId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addExpense({
        ...newExpense,
        amount: Number(newExpense.amount),
        createdBy: currentRole === 'operator' ? '运营小王' : '财务小张',
      });
      setShowModal(false);
      setNewExpense({
        propertyId: '',
        type: 'cleaning',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">费用管理</h1>
          <p className="text-slate-500 mt-1">共 {filteredExpenses.length} 条费用记录</p>
        </div>
        {currentRole !== 'landlord' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus size={18} />
            <span>新增费用</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-slate-500 text-sm">
                <th className="px-6 py-4 font-medium">日期</th>
                <th className="px-6 py-4 font-medium">房源</th>
                <th className="px-6 py-4 font-medium">类型</th>
                <th className="px-6 py-4 font-medium">描述</th>
                <th className="px-6 py-4 font-medium">金额</th>
                <th className="px-6 py-4 font-medium">录入人</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense) => {
                const property = properties.find((p) => p.id === expense.propertyId);

                return (
                  <tr key={expense.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-600">{expense.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-slate-400" />
                        <span className="text-slate-900 truncate max-w-xs">{property?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        expense.type === 'cleaning' ? 'bg-cyan-50 text-cyan-600' :
                        expense.type === 'utility' ? 'bg-amber-50 text-amber-600' :
                        expense.type === 'supplies' ? 'bg-purple-50 text-purple-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {expenseTypeNames[expense.type]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{expense.description}</td>
                    <td className="px-6 py-4 font-medium text-rose-600">-{formatCurrency(expense.amount)}</td>
                    <td className="px-6 py-4 text-slate-500 text-sm">{expense.createdBy}</td>
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
            <h3 className="text-lg font-semibold text-slate-900 mb-6">新增费用</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">房源</label>
                <select
                  value={newExpense.propertyId}
                  onChange={(e) => setNewExpense({ ...newExpense, propertyId: e.target.value })}
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
                <label className="block text-sm font-medium text-slate-700 mb-1">费用类型</label>
                <select
                  value={newExpense.type}
                  onChange={(e) => setNewExpense({ ...newExpense, type: e.target.value as ExpenseType })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="cleaning">保洁费</option>
                  <option value="utility">水电费</option>
                  <option value="supplies">物资费</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">金额</label>
                <input
                  type="number"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="请输入金额"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">日期</label>
                <input
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">描述</label>
                <input
                  type="text"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="请输入费用描述"
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
