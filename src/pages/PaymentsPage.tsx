import { useState } from 'react';
import { Search, Filter, Wallet, CheckCircle, XCircle, Clock, ArrowRight, Eye, Archive, MessageSquare } from 'lucide-react';
import { useClaimStore } from '../store/claimStore';
import type { Payment, Claim } from '../types';

export function PaymentsPage() {
  const { claims, payments, addPayment, updatePaymentStatus, addRemark, updateClaimStatus, archiveClaim, selectClaim } = useClaimStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<Payment['method']>('bank');
  const [paymentRemark, setPaymentRemark] = useState('');

  const claimsNeedingPayment = claims.filter(
    (claim) => claim.status === 'review' && claim.responsibility === 'company'
  );

  const filteredPayments = payments.filter((payment) => {
    const claim = claims.find((c) => c.id === payment.claimId);
    const matchesSearch = !searchTerm || 
                         (claim && (claim.customerName.includes(searchTerm) || claim.id.includes(searchTerm))) ||
                         payment.id.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    { value: 'all', label: '全部' },
    { value: 'pending', label: '待审核' },
    { value: 'approved', label: '已批准' },
    { value: 'paid', label: '已打款' },
    { value: 'rejected', label: '已拒绝' },
  ];

  const formatDate = (date?: Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getClaimForPayment = (claimId: string) => claims.find((c) => c.id === claimId);

  const handleOpenPaymentModal = (claim: Claim) => {
    setSelectedClaim(claim);
    setPaymentAmount('');
    setPaymentMethod('bank');
    setPaymentRemark('');
    setShowPaymentModal(true);
  };

  const handleCreatePayment = () => {
    if (!selectedClaim || !paymentAmount) return;

    addPayment({
      claimId: selectedClaim.id,
      amount: parseFloat(paymentAmount),
      method: paymentMethod,
      status: 'pending',
      remarks: paymentRemark,
    });

    addRemark(selectedClaim.id, {
      userId: 'u_admin',
      userName: '管理员',
      content: `已创建赔付申请，金额：¥${paymentAmount}`,
    });

    updateClaimStatus(selectedClaim.id, 'review');

    setShowPaymentModal(false);
    setSelectedClaim(null);
    setPaymentAmount('');
    setPaymentRemark('');
  };

  const handleApprovePayment = (payment: Payment) => {
    updatePaymentStatus(payment.id, 'approved');
    const claim = getClaimForPayment(payment.claimId);
    if (claim) {
      addRemark(claim.id, { userId: 'u_admin', userName: '管理员', content: '赔付申请已审核通过' });
      updateClaimStatus(claim.id, 'approved');
    }
  };

  const handleRejectPayment = (payment: Payment) => {
    updatePaymentStatus(payment.id, 'rejected');
    const claim = getClaimForPayment(payment.claimId);
    if (claim) {
      addRemark(claim.id, { userId: 'u_admin', userName: '管理员', content: '赔付申请已拒绝，需重新提交' });
    }
  };

  const handlePay = (payment: Payment) => {
    updatePaymentStatus(payment.id, 'paid');
    const claim = getClaimForPayment(payment.claimId);
    if (claim) {
      addRemark(claim.id, { userId: 'u_admin', userName: '管理员', content: '已完成打款' });
      updateClaimStatus(claim.id, 'paid');
    }
  };

  const handleArchive = (claimId: string) => {
    archiveClaim(claimId);
    const claim = getClaimForPayment(claimId);
    if (claim) {
      addRemark(claim.id, { userId: 'u_admin', userName: '管理员', content: '工单已归档' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">赔付处理</h2>
          <p className="text-sm text-gray-500 mt-1">审核赔付申请，完成打款操作</p>
        </div>
      </div>

      {claimsNeedingPayment.length > 0 && (
        <div className="bg-gradient-to-r from-accent-500 to-accent-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg mb-1">待创建赔付申请</h3>
              <p className="text-sm opacity-80">有 {claimsNeedingPayment.length} 个工单需要创建赔付申请</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {claimsNeedingPayment.map((claim) => (
              <div key={claim.id} className="bg-white/10 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <span className="font-medium">{claim.customerName}</span>
                  <span className="text-sm opacity-70 ml-2">{claim.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => selectClaim(claim.id)}
                    className="px-3 py-1.5 bg-white/20 text-white text-sm rounded-lg hover:bg-white/30 transition-colors flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    查看详情
                  </button>
                  <button
                    onClick={() => handleOpenPaymentModal(claim)}
                    className="px-4 py-1.5 bg-white text-accent-600 text-sm font-medium rounded-lg hover:bg-white/90 transition-colors"
                  >
                    创建赔付
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索客户名称、工单编号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">赔付单号</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">关联工单</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">客户</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">支付方式</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredPayments.map((payment) => {
              const claim = getClaimForPayment(payment.claimId);
              return (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-primary-600">{payment.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">{claim?.id || '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">{claim?.customerName || '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-accent-600">¥{payment.amount.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {payment.method === 'bank' ? '银行转账' : payment.method === 'wechat' ? '微信' : '支付宝'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      payment.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                      payment.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {payment.status === 'pending' ? '待审核' :
                       payment.status === 'approved' ? '已批准' :
                       payment.status === 'paid' ? '已打款' : '已拒绝'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-500">
                      {payment.status === 'paid' ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(payment.paidAt)}
                        </span>
                      ) : payment.status === 'approved' ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(payment.approvedAt)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => claim && selectClaim(claim.id)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="查看工单详情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {payment.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprovePayment(payment)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="审核通过"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRejectPayment(payment)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="拒绝"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {payment.status === 'approved' && (
                        <button
                          onClick={() => handlePay(payment)}
                          className="px-3 py-1.5 bg-accent-600 text-white text-xs rounded-lg hover:bg-accent-700 transition-colors flex items-center gap-1"
                        >
                          <Wallet className="w-3 h-3" />
                          打款
                        </button>
                      )}
                      {payment.status === 'paid' && (
                        <button
                          onClick={() => claim && handleArchive(claim.id)}
                          className="px-3 py-1.5 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-1"
                        >
                          <Archive className="w-3 h-3" />
                          归档
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showPaymentModal && selectedClaim && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">创建赔付申请</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">关联工单</label>
                <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-sm font-mono text-primary-600">{selectedClaim.id}</span>
                  <span className="text-sm text-gray-600 ml-2">{selectedClaim.customerName}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">赔付金额</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">支付方式</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'bank', label: '银行转账' },
                    { value: 'wechat', label: '微信' },
                    { value: 'alipay', label: '支付宝' },
                  ].map((method) => (
                    <button
                      key={method.value}
                      onClick={() => setPaymentMethod(method.value as Payment['method'])}
                      className={`px-4 py-2.5 border rounded-lg transition-colors ${
                        paymentMethod === method.value
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">备注</label>
                <textarea
                  value={paymentRemark}
                  onChange={(e) => setPaymentRemark(e.target.value)}
                  placeholder="输入赔付备注..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreatePayment}
                  disabled={!paymentAmount}
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Wallet className="w-4 h-4" />
                  创建申请
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
