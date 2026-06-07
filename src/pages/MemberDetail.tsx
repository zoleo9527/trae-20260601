import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  Wallet,
  TrendingUp,
  Plus,
  Minus,
  Clock,
  AlertTriangle,
  Check
} from 'lucide-react';
import { useMemberStore } from '../stores/memberStore';
import { useBookingStore } from '../stores/bookingStore';
import { useAnomalyStore } from '../stores/anomalyStore';
import { formatDateTime } from '../utils/storage';
import { TransactionType } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Link } from 'react-router-dom';

const MemberDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getMemberById, getTransactionsByMember, addTransaction, checkBalanceConsistency } = useMemberStore();
  const { getBookingsByRoom } = useBookingStore();
  const { getAnomaliesByMemberId } = useAnomalyStore();

  const [showRecharge, setShowRecharge] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [transactionNote, setTransactionNote] = useState('');

  const member = getMemberById(id!);
  const transactions = id ? getTransactionsByMember(id) : [];
  const consistency = member ? checkBalanceConsistency(member.id) : { consistent: true, diff: 0 };
  const memberAnomalies = id ? getAnomaliesByMemberId(id) : [];

  if (!member) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">会员不存在</p>
        <button
          onClick={() => navigate('/members')}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
        >
          返回会员列表
        </button>
      </div>
    );
  }

  const handleRecharge = () => {
    const amount = parseFloat(rechargeAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('请输入有效金额');
      return;
    }
    addTransaction(member.id, 'recharge', amount, undefined, transactionNote || undefined);
    setShowRecharge(false);
    setRechargeAmount('');
    setTransactionNote('');
  };

  const typeLabels: Record<TransactionType, { label: string; icon: typeof Plus; color: string }> = {
    recharge: { label: '充值', icon: Plus, color: 'text-emerald-400' },
    consume: { label: '消费', icon: Minus, color: 'text-red-400' },
    refund: { label: '退款', icon: Plus, color: 'text-blue-400' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/members')}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">会员详情</h2>
            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
              {member.level}
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowRecharge(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          会员充值
        </button>
      </div>

      {memberAnomalies.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            账务异常 ({memberAnomalies.length})
          </h3>
          <div className="space-y-2">
            {memberAnomalies.map((a) => (
              <Link
                key={a.id}
                to="/anomalies"
                className={`block p-3 rounded-lg border transition-colors ${
                  a.status === 'resolved'
                    ? 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10'
                    : a.status === 'ignored'
                    ? 'bg-slate-800/30 border-slate-700 hover:bg-slate-800/50'
                    : 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">会员账务异常</span>
                  <StatusBadge status={a.status} type="anomaly" />
                </div>
                <p className={`text-sm ${
                  a.status === 'resolved' ? 'text-emerald-300' : a.status === 'ignored' ? 'text-slate-500' : 'text-red-300'
                }`}>{a.description}</p>
                {a.handlingNote && (
                  <p className="text-xs text-slate-400 mt-1.5 truncate">
                    处理结果：{a.handlingNote}
                  </p>
                )}
                <p className="text-xs text-slate-600 mt-1">{formatDateTime(a.createdAt)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <Wallet className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">账户余额</p>
              <p className="text-2xl font-bold text-emerald-400">¥{member.balance.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">累计消费</p>
              <p className="text-2xl font-bold">¥{member.totalSpent.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 rounded-lg">
              <Check className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">交易笔数</p>
              <p className="text-2xl font-bold">{transactions.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 rounded-lg">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">注册时间</p>
              <p className="text-sm font-medium mt-1">{formatDateTime(member.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            基本信息
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-400 mb-1">会员姓名</p>
              <p className="font-medium">{member.name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">联系电话</p>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-500" />
                <span>{member.phone}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">会员等级</p>
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
                {member.level}
              </span>
            </div>
          </div>
        </div>

        <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-5">
          <h3 className="font-semibold mb-4">交易记录（账务追溯）</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-3 py-2 font-medium text-slate-400">时间</th>
                  <th className="text-left px-3 py-2 font-medium text-slate-400">类型</th>
                  <th className="text-right px-3 py-2 font-medium text-slate-400">金额</th>
                  <th className="text-right px-3 py-2 font-medium text-slate-400">余额</th>
                  <th className="text-left px-3 py-2 font-medium text-slate-400">操作员</th>
                  <th className="text-left px-3 py-2 font-medium text-slate-400">备注</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      暂无交易记录
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => {
                    const typeInfo = typeLabels[t.type];
                    const Icon = typeInfo.icon;
                    return (
                      <tr key={t.id} className="border-b border-slate-800/50 last:border-0">
                        <td className="px-3 py-2.5 text-slate-400 text-xs">
                          {formatDateTime(t.createdAt)}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex items-center gap-1 ${typeInfo.color}`}>
                            <Icon className="w-3 h-3" />
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className={`px-3 py-2.5 text-right font-medium ${typeInfo.color}`}>
                          {t.type === 'consume' ? '-' : '+'}¥{Math.abs(t.amount).toFixed(2)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-slate-300">
                          ¥{t.balanceAfter.toFixed(2)}
                        </td>
                        <td className="px-3 py-2.5 text-slate-400">
                          {t.operator || '-'}
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 text-xs max-w-[150px] truncate">
                          {t.note || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showRecharge && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-sm w-full mx-4">
            <h4 className="font-semibold text-lg mb-4">会员充值</h4>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 block mb-1.5">充值金额</label>
                <input
                  type="number"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  placeholder="输入金额"
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-1.5">备注（可选）</label>
                <input
                  type="text"
                  value={transactionNote}
                  onChange={(e) => setTransactionNote(e.target.value)}
                  placeholder="充值说明"
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowRecharge(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleRecharge}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  确认充值
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberDetail;
