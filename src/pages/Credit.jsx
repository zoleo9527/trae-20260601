import { useEffect, useState } from 'react';
import { useStore } from '../stores/appStore';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function Credit() {
  const { credits, fetchCredits, repayCredit, loading } = useStore();
  const { currentUser } = useStore();

  const [filter, setFilter] = useState('');
  const [repayModal, setRepayModal] = useState(null);
  const [repayAmount, setRepayAmount] = useState('');

  useEffect(() => {
    fetchCredits();
  }, [filter]);

  const overdueCredits = credits.filter(c => c.status === 'overdue');
  const pendingCredits = credits.filter(c => c.status === 'pending' || c.status === 'partial');

  const handleRepay = async () => {
    if (!repayModal || !repayAmount || parseFloat(repayAmount) <= 0) {
      alert('请输入正确的还款金额');
      return;
    }

    try {
      await repayCredit(repayModal.id, parseFloat(repayAmount), currentUser.id);
      setRepayModal(null);
      setRepayAmount('');
      alert('还款登记成功！');
    } catch (err) {
      alert(err.message);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { label: '待还款', className: 'bg-blue-100 text-blue-800' },
      partial: { label: '部分还款', className: 'bg-yellow-100 text-yellow-800' },
      repaid: { label: '已还清', className: 'bg-green-100 text-green-800' },
      overdue: { label: '逾期', className: 'bg-red-100 text-red-800' },
    };
    return config[status] || config.pending;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diff = Math.floor((today - date) / (1000 * 60 * 60 * 24));

    if (diff > 0) {
      return `${diff}天前`;
    }
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">赊账管理</h1>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">全部</option>
          <option value="overdue">逾期</option>
          <option value="pending">待还款</option>
          <option value="partial">部分还款</option>
          <option value="repaid">已还清</option>
        </select>
      </div>

      {/* Overdue Alert */}
      {overdueCredits.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-red-800">
                您有 {overdueCredits.length} 笔逾期赊账需要处理
              </p>
              <p className="text-sm text-red-600 mt-1">
                合计：¥{overdueCredits.reduce((sum, c) => sum + (c.amount - c.repaid_amount), 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="text-red-500" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{overdueCredits.length}</p>
              <p className="text-sm text-gray-500">逾期赊账</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Clock className="text-blue-500" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{pendingCredits.length}</p>
              <p className="text-sm text-gray-500">待还款</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="text-green-500" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                ¥{credits.reduce((sum, c) => sum + c.repaid_amount, 0).toFixed(2)}
              </p>
              <p className="text-sm text-gray-500">已还款总额</p>
            </div>
          </div>
        </div>
      </div>

      {/* Credits Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">客户</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">赊账金额</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">已还</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">待还</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">到期日</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {credits.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-400">
                  暂无赊账记录
                </td>
              </tr>
            ) : (
              credits.map((credit) => {
                const remaining = credit.amount - credit.repaid_amount;
                const isOverdue = credit.status === 'overdue';
                const badge = getStatusBadge(credit.status);

                return (
                  <tr key={credit.id} className={`hover:bg-gray-50 ${isOverdue ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">{credit.customer_name}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      ¥{credit.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-green-600">
                      ¥{credit.repaid_amount.toFixed(2)}
                    </td>
                    <td className={`px-6 py-4 font-medium ${isOverdue ? 'text-red-600' : 'text-gray-800'}`}>
                      ¥{remaining.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <p className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                        {new Date(credit.due_date).toLocaleDateString('zh-CN')}
                      </p>
                      {isOverdue && (
                        <p className="text-xs text-red-400">
                          {formatDate(credit.due_date)}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {credit.status !== 'repaid' && (
                        <button
                          onClick={() => {
                            setRepayModal(credit);
                            setRepayAmount(remaining.toFixed(2));
                          }}
                          className="px-3 py-1 bg-primary text-white rounded text-sm hover:bg-primary-dark transition-colors"
                        >
                          还款
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Repay Modal */}
      {repayModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 animate-fadeIn">
            <h3 className="text-lg font-bold text-gray-800 mb-4">还款登记</h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">客户</p>
                <p className="font-medium text-gray-800">{repayModal.customer_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">赊账金额</p>
                  <p className="font-medium text-gray-800">¥{repayModal.amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">待还金额</p>
                  <p className="font-medium text-red-600">
                    ¥{(repayModal.amount - repayModal.repaid_amount).toFixed(2)}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  还款金额
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="请输入还款金额"
                />
                <p className="text-xs text-gray-400 mt-1">
                  可输入任意金额进行部分还款
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setRepayModal(null);
                  setRepayAmount('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleRepay}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                确认还款
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
