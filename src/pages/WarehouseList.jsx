import { useEffect, useState } from 'react';
import { useStore } from '../stores/appStore';
import { Link } from 'react-router-dom';
import { Eye, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

export default function WarehouseList() {
  const { sales, fetchSales, warehouseConfirmSale, loading } = useStore();
  const { currentUser } = useStore();

  const [confirming, setConfirming] = useState(null);
  const [comments, setComments] = useState('');

  useEffect(() => {
    fetchSales({ status: 'pending_warehouse' });
    fetchSales({ status: 'stock_insufficient' });
  }, []);

  const pendingSales = sales.filter(
    s => s.status === 'pending_warehouse' || s.status === 'stock_insufficient'
  );

  const handleConfirm = async (id) => {
    try {
      const result = await warehouseConfirmSale(id, currentUser.id, { comments });

      if (result.error?.code === 'INVENTORY_INSUFFICIENT') {
        alert(`库存不足：\n${result.error.details.map(i =>
          `${i.pesticideName}: 需要 ${i.required}，当前 ${i.available}`
        ).join('\n')}`);
      } else {
        alert('出库确认成功！');
        setConfirming(null);
        setComments('');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">出库确认</h1>
        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
          {pendingSales.length} 待出库
        </span>
      </div>

      {/* List */}
      {pendingSales.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <Package className="mx-auto text-green-400 mb-4" size={48} />
          <p className="text-gray-500">暂无待出库的销售单</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingSales.map((sale) => (
            <div
              key={sale.id}
              className={`bg-white rounded-xl p-6 shadow-sm ${
                sale.status === 'stock_insufficient' ? 'ring-2 ring-orange-300' : ''
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-gray-800">{sale.customer_name}</h3>
                    {sale.status === 'stock_insufficient' && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium flex items-center gap-1">
                        <AlertTriangle size={12} />
                        库存不足
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
                      <span className="font-medium text-gray-800">{item.pesticide_name}</span>
                      <span className="text-gray-600">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirmation Info */}
              {sale.confirmation && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    <span className="font-medium">用药提醒：</span>
                    {sale.confirmation.reminder || '无'}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    确认人：{sale.confirmation.confirmed_by_name} |
                    结果：{sale.confirmation.result === 'available' ? '可用' : sale.confirmation.result === 'caution' ? '慎用' : '禁用'}
                  </p>
                </div>
              )}

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

                  {sale.status === 'stock_insufficient' ? (
                    <button
                      disabled
                      className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-400 rounded-lg cursor-not-allowed"
                    >
                      <AlertTriangle size={18} />
                      等待补货
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirming(sale.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                    >
                      <CheckCircle size={18} />
                      确认出库
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Modal */}
      {confirming && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 animate-fadeIn">
            <h3 className="text-lg font-bold text-gray-800 mb-4">确认出库</h3>

            <div className="space-y-4">
              <p className="text-gray-600">
                请确认以下销售单的农药已出库：
              </p>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-800 mb-2">
                  销售单 #{confirming.slice(0, 8)}
                </p>
                <p className="text-sm text-gray-600">
                  确认出库后将自动扣减库存
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">备注（选填）</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="可填写出库备注..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setConfirming(null);
                  setComments('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleConfirm(confirming)}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                确认出库
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
