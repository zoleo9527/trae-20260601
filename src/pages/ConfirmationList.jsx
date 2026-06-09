import { useEffect, useState } from 'react';
import { useStore } from '../stores/appStore';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

export default function ConfirmationList() {
  const { sales, fetchSales, confirmSale, loading } = useStore();
  const { currentUser } = useStore();
  const navigate = useNavigate();

  const [confirmModal, setConfirmModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [formData, setFormData] = useState({
    result: 'available',
    reminder: '',
    comments: '',
  });

  useEffect(() => {
    fetchSales({ status: 'pending_confirmation' });
  }, []);

  const pendingSales = sales.filter(s => s.status === 'pending_confirmation');

  const handleConfirm = async () => {
    if (!confirmModal) return;

    try {
      const result = await confirmSale(confirmModal.id, currentUser.id, formData);
      setConfirmModal(null);
      setFormData({ result: 'available', reminder: '', comments: '' });
      alert(formData.result === 'prohibited' ? '已退回该销售单' : '已确认用药提醒');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReject = async () => {
    if (!rejectModal || !formData.comments.trim()) {
      alert('请填写退回原因');
      return;
    }

    try {
      await confirmSale(rejectModal.id, currentUser.id, {
        ...formData,
        result: 'prohibited',
      });
      setRejectModal(null);
      setFormData({ result: 'available', reminder: '', comments: '' });
      alert('已退回该销售单');
    } catch (err) {
      alert(err.message);
    }
  };

  const hasProhibited = (items) => items.some(item => item.pesticide_type === '禁用');

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">用药确认</h1>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
          {pendingSales.length} 待确认
        </span>
      </div>

      {/* List */}
      {pendingSales.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <CheckCircle className="mx-auto text-green-400 mb-4" size={48} />
          <p className="text-gray-500">暂无待确认的销售单</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingSales.map((sale) => {
            const hasProhibitedPesticide = hasProhibited(sale.items);

            return (
              <div
                key={sale.id}
                className={`bg-white rounded-xl p-6 shadow-sm ${
                  hasProhibitedPesticide ? 'ring-2 ring-red-300' : ''
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-gray-800">{sale.customer_name}</h3>
                      {hasProhibitedPesticide && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium flex items-center gap-1">
                          <AlertTriangle size={12} />
                          含禁用农药
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(sale.created_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <StatusBadge status={sale.status} />
                </div>

                {/* Items */}
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">农药明细：</p>
                  <div className="space-y-2">
                    {sale.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-800">{item.pesticide_name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            item.pesticide_type === '常规' ? 'bg-green-100 text-green-700' :
                            item.pesticide_type === '限用' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {item.pesticide_type}
                          </span>
                        </div>
                        <span className="text-gray-600">
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                    <span className="text-sm text-gray-500">订单金额</span>
                    <span className="ml-2 text-xl font-bold text-primary">
                      ¥{sale.total_amount.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      to={`/trace/${sale.id}`}
                      className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Eye size={18} />
                      查看详情
                    </Link>

                    {hasProhibitedPesticide ? (
                      <button
                        onClick={() => {
                          setRejectModal(sale);
                          setFormData(prev => ({ ...prev, comments: '' }));
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <XCircle size={18} />
                        退回
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setConfirmModal(sale);
                            setFormData({ result: 'available', reminder: '', comments: '' });
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                          <CheckCircle size={18} />
                          确认
                        </button>
                        <button
                          onClick={() => {
                            setRejectModal(sale);
                            setFormData(prev => ({ ...prev, comments: '' }));
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                        >
                          <XCircle size={18} />
                          退回
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 animate-fadeIn">
            <h3 className="text-lg font-bold text-gray-800 mb-4">确认用药提醒</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">用药判断</label>
                <div className="flex gap-4">
                  {[
                    { value: 'available', label: '可用', color: 'bg-green-500' },
                    { value: 'caution', label: '慎用', color: 'bg-yellow-500' },
                  ].map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="result"
                        value={opt.value}
                        checked={formData.result === opt.value}
                        onChange={(e) => setFormData(prev => ({ ...prev, result: e.target.value }))}
                        className="w-4 h-4"
                      />
                      <span className={`px-3 py-1 ${opt.color} text-white rounded-full text-sm`}>
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">用药提醒内容</label>
                <textarea
                  value={formData.reminder}
                  onChange={(e) => setFormData(prev => ({ ...prev, reminder: e.target.value }))}
                  placeholder="请填写用药注意事项、浓度配比、安全间隔期等..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">备注（选填）</label>
                <input
                  type="text"
                  value={formData.comments}
                  onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 animate-fadeIn">
            <h3 className="text-lg font-bold text-red-600 mb-4">退回销售单</h3>

            <div className="space-y-4">
              <p className="text-gray-600">
                请填写退回原因，该销售单将返回给门店老板修改。
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  退回原因 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.comments}
                  onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                  placeholder="请详细说明退回原因..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  rows={4}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setRejectModal(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                确认退回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
