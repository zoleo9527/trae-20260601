import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Calendar, ChevronRight, Plus } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatCurrency, billStatusNames } from '../data/mockData';

export default function Bills() {
  const { currentRole, currentLandlordId, bills, properties, landlords, addBill } = useStore();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    propertyId: '',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });
  const [generating, setGenerating] = useState(false);

  const filteredProperties = currentRole === 'landlord'
    ? properties.filter((p) => p.landlordId === currentLandlordId)
    : properties;

  const propertyIds = filteredProperties.map((p) => p.id);
  const filteredBills = bills.filter((b) => propertyIds.includes(b.propertyId));

  const handleGenerateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await addBill(generateForm.propertyId, generateForm.year, generateForm.month);
      setShowGenerateModal(false);
      setGenerateForm({
        propertyId: '',
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
      });
    } catch (error) {
      console.error('Failed to generate bill:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">账单管理</h1>
          <p className="text-slate-500 mt-1">共 {filteredBills.length} 条账单</p>
        </div>
        {currentRole === 'finance' && (
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus size={18} />
            <span>生成账单</span>
          </button>
        )}
      </div>

      <div className="space-y-6">
        {filteredBills.map((bill) => {
          const property = properties.find((p) => p.id === bill.propertyId);
          const landlord = landlords.find((l) => l.id === bill.landlordId);

          return (
            <Link
              key={bill.id}
              to={`/bills/${bill.id}`}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all group block"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-slate-900 text-lg">{bill.year}年{bill.month}月账单</h3>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      bill.status === 'settled' ? 'bg-emerald-50 text-emerald-600' :
                      bill.status === 'confirmed' ? 'bg-blue-50 text-blue-600' :
                      bill.status === 'disputed' ? 'bg-rose-50 text-rose-600' :
                      bill.status === 'sent' ? 'bg-cyan-50 text-cyan-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {billStatusNames[bill.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 text-sm">
                    <Building2 size={14} />
                    <span>{property?.name}</span>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-400 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-slate-500 text-xs mb-1">订单收入</p>
                  <p className="font-semibold text-emerald-600">{formatCurrency(bill.totalIncome)}</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-slate-500 text-xs mb-1">总支出</p>
                  <p className="font-semibold text-rose-600">-{formatCurrency(bill.totalExpenses + bill.totalRepairs)}</p>
                </div>
                <div className="text-center p-3 bg-teal-50 rounded-lg">
                  <p className="text-slate-500 text-xs mb-1">净收入</p>
                  <p className="font-bold text-teal-600">{formatCurrency(bill.netAmount)}</p>
                </div>
              </div>

              {landlord && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                      <span className="text-teal-600 font-medium text-sm">{landlord.name[0]}</span>
                    </div>
                    <span className="text-slate-600 text-sm">{landlord.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 text-sm">
                    <Calendar size={14} />
                    <span>{bill.createdAt}</span>
                  </div>
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">生成月度账单</h3>
            <form onSubmit={handleGenerateBill} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">选择房源</label>
                <select
                  value={generateForm.propertyId}
                  onChange={(e) => setGenerateForm({ ...generateForm, propertyId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                >
                  <option value="">请选择房源</option>
                  {filteredProperties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">年份</label>
                  <select
                    value={generateForm.year}
                    onChange={(e) => setGenerateForm({ ...generateForm, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {[2023, 2024, 2025, 2026].map((year) => (
                      <option key={year} value={year}>{year}年</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">月份</label>
                  <select
                    value={generateForm.month}
                    onChange={(e) => setGenerateForm({ ...generateForm, month: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
                      <option key={month} value={month}>{month}月</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  disabled={generating}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                  disabled={generating}
                >
                  {generating ? '生成中...' : '生成账单'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}