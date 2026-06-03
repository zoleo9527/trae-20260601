import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, User, UserCircle, Check, X, FileText, DollarSign, Calendar } from 'lucide-react';
import { useStore } from '../store/useStore';
import { disputeStatusNames, formatCurrency } from '../data/mockData';

export default function DisputeDetail() {
  const { id } = useParams<{ id: string }>();
  const { disputes, properties, bills, landlords, orders, expenses, repairs, addDisputeMessage, resolveDispute, currentRole } = useStore();
  const [message, setMessage] = useState('');
  const [showResolve, setShowResolve] = useState(false);
  const [resolution, setResolution] = useState('');
  const [resolveStatus, setResolveStatus] = useState<'resolved' | 'rejected'>('resolved');

  const dispute = disputes.find((d) => d.id === id);
  if (!dispute) return <div>异议不存在</div>;

  const bill = bills.find((b) => b.id === dispute.billId);
  const property = properties.find((p) => p.id === bill?.propertyId);
  const landlord = landlords.find((l) => l.id === dispute.landlordId);

  const getDisputedItem = () => {
    if (!dispute.itemId) return null;
    switch (dispute.type) {
      case 'income':
        return orders.find((o) => o.id === dispute.itemId);
      case 'expense':
        return expenses.find((e) => e.id === dispute.itemId);
      case 'repair':
        return repairs.find((r) => r.id === dispute.itemId);
      default:
        return null;
    }
  };

  const getItemName = (item: any) => {
    if (!item) return '';
    switch (dispute.type) {
      case 'income':
        return `${item.guestName} - ${item.checkIn}`;
      case 'expense':
        return item.description;
      case 'repair':
        return item.title;
      default:
        return '';
    }
  };

  const getItemAmount = (item: any) => {
    if (!item) return 0;
    switch (dispute.type) {
      case 'income':
        return item.totalAmount;
      case 'expense':
        return item.amount;
      case 'repair':
        return item.cost;
      default:
        return 0;
    }
  };

  const disputedItem = getDisputedItem();
  const itemName = getItemName(disputedItem);
  const itemAmount = getItemAmount(disputedItem);

  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await addDisputeMessage(dispute.id, currentRole === 'landlord' ? 'landlord' : 'operator', message);
      setMessage('');
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    setResolving(true);
    try {
      await resolveDispute(dispute.id, resolveStatus, resolution);
      setShowResolve(false);
    } finally {
      setResolving(false);
    }
  };

  const isCurrentUserLandlord = currentRole === 'landlord';

  return (
    <div className="p-8">
      <Link to="/disputes" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6">
        <ArrowLeft size={18} />
        <span>返回异议列表</span>
      </Link>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">{dispute.title}</h2>
                <p className="text-slate-500 text-sm mt-1">{property?.name}</p>
              </div>
              <span className={`px-3 py-1 rounded-lg text-sm ${
                dispute.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' :
                dispute.status === 'reviewing' ? 'bg-amber-50 text-amber-600' :
                dispute.status === 'rejected' ? 'bg-rose-50 text-rose-600' :
                'bg-slate-100 text-slate-600'
              }`}>
                {disputeStatusNames[dispute.status]}
              </span>
            </div>
          </div>

          {disputedItem && (
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-medium text-slate-700 mb-2">被质疑条目</h3>
              <div className="bg-white rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <FileText size={14} className="text-slate-400" />
                  <span className="text-slate-600">条目名称：</span>
                  <span className="font-medium text-slate-900">{itemName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign size={14} className="text-slate-400" />
                  <span className="text-slate-600">涉及金额：</span>
                  <span className={`font-medium ${dispute.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {dispute.type === 'income' ? '+' : '-'}{formatCurrency(itemAmount)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={14} className="text-slate-400" />
                  <span className="text-slate-600">所属账单：</span>
                  <span className="font-medium text-slate-900">{bill?.year}年{bill?.month}月</span>
                </div>
              </div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {dispute.messages.map((msg) => {
              const isMine = (isCurrentUserLandlord && msg.sender === 'landlord') || (!isCurrentUserLandlord && msg.sender === 'operator');
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs ${msg.sender === 'landlord' ? 'bg-teal-50' : 'bg-slate-100'} rounded-2xl px-4 py-3`}>
                    <div className="flex items-center gap-2 mb-1">
                      {msg.sender === 'landlord' ? (
                        <User size={14} className="text-teal-600" />
                      ) : (
                        <UserCircle size={14} className="text-slate-500" />
                      )}
                      <span className="text-xs font-medium">
                        {msg.sender === 'landlord' ? landlord?.name : '运营'}
                      </span>
                    </div>
                    <p className="text-slate-700 text-sm">{msg.content}</p>
                    <p className="text-xs text-slate-400 mt-1">{msg.createdAt}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {dispute.status !== 'resolved' && dispute.status !== 'rejected' && (
            <div className="p-4 border-t border-slate-100">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="输入消息..."
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  onClick={handleSendMessage}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                  disabled={sending}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-900 mb-4">异议详情</h3>
            <div className="space-y-4">
              <div>
                <p className="text-slate-500 text-sm">类型</p>
                <p className="text-slate-900 font-medium">
                  {dispute.type === 'income' ? '收入疑问' :
                   dispute.type === 'expense' ? '费用疑问' :
                   dispute.type === 'repair' ? '维修疑问' : '其他'}
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-sm">详细描述</p>
                <p className="text-slate-600">{dispute.description}</p>
              </div>
              <div>
                <p className="text-slate-500 text-sm">创建时间</p>
                <p className="text-slate-600">{dispute.createdAt}</p>
              </div>
              {dispute.resolution && (
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-slate-500 text-sm">处理结果</p>
                  <p className="text-slate-600">{dispute.resolution}</p>
                </div>
              )}
            </div>
          </div>

          {currentRole !== 'landlord' && dispute.status !== 'resolved' && dispute.status !== 'rejected' && (
            <button
              onClick={() => setShowResolve(true)}
              className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
            >
              处理异议
            </button>
          )}
        </div>
      </div>

      {showResolve && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">处理异议</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">处理方式</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setResolveStatus('resolved')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                      resolveStatus === 'resolved'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Check size={18} />
                    确认
                  </button>
                  <button
                    onClick={() => setResolveStatus('rejected')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                      resolveStatus === 'rejected'
                        ? 'border-rose-500 bg-rose-50 text-rose-600'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <X size={18} />
                    驳回
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">处理说明</label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  rows={3}
                  placeholder="请输入处理说明..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowResolve(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  disabled={resolving}
                >
                  取消
                </button>
                <button
                  onClick={handleResolve}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                  disabled={resolving}
                >
                  {resolving ? '处理中...' : '确认处理'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}