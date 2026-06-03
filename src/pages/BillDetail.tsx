import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, MessageSquareWarning } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatCurrency, platformNames, expenseTypeNames } from '../data/mockData';
import type { DisputeType } from '../../shared/types';

export default function BillDetail() {
  const { id } = useParams<{ id: string }>();
  const { bills, properties, orders, expenses, repairs, advances, landlords, addDispute, currentRole } = useStore();
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newDispute, setNewDispute] = useState({
    type: 'expense' as DisputeType,
    itemId: '',
    title: '',
    description: '',
  });

  const bill = bills.find((b) => b.id === id);
  if (!bill) return <div>账单不存在</div>;

  const property = properties.find((p) => p.id === bill.propertyId);
  const landlord = landlords.find((l) => l.id === bill.landlordId);

  const billOrders = orders.filter((o) => {
    const checkInDate = new Date(o.checkIn);
    return o.propertyId === bill.propertyId &&
      checkInDate.getMonth() + 1 === bill.month &&
      checkInDate.getFullYear() === bill.year;
  });

  const billExpenses = expenses.filter((e) => {
    const expenseDate = new Date(e.date);
    return e.propertyId === bill.propertyId &&
      expenseDate.getMonth() + 1 === bill.month &&
      expenseDate.getFullYear() === bill.year;
  });

  const billRepairs = repairs.filter((r) => {
    const repairDate = new Date(r.date);
    return r.propertyId === bill.propertyId &&
      repairDate.getMonth() + 1 === bill.month &&
      repairDate.getFullYear() === bill.year;
  });

  const billAdvances = advances.filter((a) => {
    const advanceDate = new Date(a.date);
    return a.propertyId === bill.propertyId &&
      advanceDate.getMonth() + 1 === bill.month &&
      advanceDate.getFullYear() === bill.year;
  });

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDispute({
        ...newDispute,
        billId: bill.id,
        landlordId: bill.landlordId,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      setShowDisputeModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <Link to="/bills" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6">
        <ArrowLeft size={18} />
        <span>返回账单列表</span>
      </Link>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{bill.year}年{bill.month}月对账单</h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-slate-500">{property?.name}</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">房东：{landlord?.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded-lg text-sm ${
              bill.status === 'settled' ? 'bg-emerald-50 text-emerald-600' :
              bill.status === 'confirmed' ? 'bg-blue-50 text-blue-600' :
              bill.status === 'disputed' ? 'bg-rose-50 text-rose-600' :
              bill.status === 'sent' ? 'bg-cyan-50 text-cyan-600' :
              'bg-slate-100 text-slate-600'
            }`}>
              {bill.status === 'settled' ? '已结算' :
               bill.status === 'confirmed' ? '已确认' :
               bill.status === 'disputed' ? '有异议' :
               bill.status === 'sent' ? '已发送' : '草稿'}
            </span>
            {currentRole === 'landlord' && bill.status !== 'disputed' && (
              <button
                onClick={() => setShowDisputeModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
              >
                <MessageSquareWarning size={16} />
                提出异议
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-6 gap-4">
          <div className="p-4 bg-emerald-50 rounded-xl text-center">
            <p className="text-emerald-600 text-xs mb-1">订单总收入</p>
            <p className="text-xl font-bold text-emerald-700">{formatCurrency(bill.totalIncome)}</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl text-center">
            <p className="text-amber-600 text-xs mb-1">平台扣点</p>
            <p className="text-xl font-bold text-amber-700">-{formatCurrency(bill.platformFees)}</p>
          </div>
          <div className="p-4 bg-rose-50 rounded-xl text-center">
            <p className="text-rose-600 text-xs mb-1">费用支出</p>
            <p className="text-xl font-bold text-rose-700">-{formatCurrency(bill.totalExpenses)}</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-xl text-center">
            <p className="text-orange-600 text-xs mb-1">维修费用</p>
            <p className="text-xl font-bold text-orange-700">-{formatCurrency(bill.totalRepairs)}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl text-center">
            <p className="text-purple-600 text-xs mb-1">垫付金额</p>
            <p className="text-xl font-bold text-purple-700">-{formatCurrency(bill.totalAdvances)}</p>
          </div>
          <div className="p-4 bg-teal-100 rounded-xl text-center">
            <p className="text-teal-700 text-xs mb-1">净收入</p>
            <p className="text-xl font-bold text-teal-800">{formatCurrency(bill.netAmount)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">订单明细</h3>
          </div>
          <div className="p-4">
            {billOrders.map((order, index) => (
              <div key={order.id} className={`py-3 ${index > 0 ? 'border-t border-slate-100' : ''}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{order.guestName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                        {platformNames[order.platform]}
                      </span>
                      <span className="text-xs text-slate-500">{order.checkIn} - {order.checkOut}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-emerald-600">{formatCurrency(order.totalAmount)}</p>
                    {order.refundAmount > 0 && (
                      <p className="text-xs text-rose-500">退款 {formatCurrency(order.refundAmount)}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">费用明细</h3>
          </div>
          <div className="p-4">
            {billExpenses.map((expense, index) => (
              <div key={expense.id} className={`py-3 ${index > 0 ? 'border-t border-slate-100' : ''}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{expense.description}</p>
                    <span className="text-xs px-2 py-0.5 bg-cyan-50 text-cyan-600 rounded">
                      {expenseTypeNames[expense.type]}
                    </span>
                  </div>
                  <p className="font-medium text-rose-600">-{formatCurrency(expense.amount)}</p>
                </div>
              </div>
            ))}
            {billRepairs.length > 0 && (
              <div className="py-3 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-2">
                  <span className="font-medium">维修费用</span>
                </p>
                {billRepairs.map((repair) => (
                  <div key={repair.id} className="py-2 flex items-center justify-between">
                    <span className="text-slate-600 text-sm">{repair.title}</span>
                    <span className="text-rose-600 font-medium">-{formatCurrency(repair.cost)}</span>
                  </div>
                ))}
              </div>
            )}
            {billAdvances.length > 0 && (
              <div className="py-3 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-2">
                  <span className="font-medium">垫付记录</span>
                </p>
                {billAdvances.map((advance) => (
                  <div key={advance.id} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="text-slate-600 text-sm">{advance.reason}</span>
                      {advance.repairId && (
                        <span className="text-xs text-slate-400 ml-2">关联维修</span>
                      )}
                    </div>
                    <span className="text-purple-600 font-medium">-{formatCurrency(advance.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showDisputeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">提出异议</h3>
            <form onSubmit={handleSubmitDispute} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">异议类型</label>
                <select
                  value={newDispute.type}
                  onChange={(e) => setNewDispute({ ...newDispute, type: e.target.value as DisputeType })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="income">收入疑问</option>
                  <option value="expense">费用疑问</option>
                  <option value="repair">维修疑问</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">标题</label>
                <input
                  type="text"
                  value={newDispute.title}
                  onChange={(e) => setNewDispute({ ...newDispute, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="简要描述问题"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">详细描述</label>
                <textarea
                  value={newDispute.description}
                  onChange={(e) => setNewDispute({ ...newDispute, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  rows={4}
                  placeholder="请详细描述您的疑问..."
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  disabled={submitting}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? '提交中...' : '提交异议'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
