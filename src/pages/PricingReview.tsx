import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, Clock, AlertTriangle, Calculator, ArrowUp, ArrowDown, RefreshCw, Package } from 'lucide-react';
import { useStore } from '../store';

const changeTypeConfig = {
  upgrade: { label: '升级', icon: ArrowUp },
  downgrade: { label: '降级', icon: ArrowDown },
  replace: { label: '替换', icon: RefreshCw },
};

export default function PricingReview() {
  const { id } = useParams<{ id: string }>();
  const { getOrderById, updatePaidAmount } = useStore();
  const order = getOrderById(id || '');
  const [confirmAmount, setConfirmAmount] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  if (!order) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">订单不存在</p>
      </div>
    );
  }

  const configTotal = order.config_items.reduce((sum, item) => sum + item.total_price, 0);
  const modifyTotal = order.modify_records.reduce((sum, record) => sum + record.price_diff, 0);
  const installedTotal = order.installed_parts.reduce((sum, part) => sum + part.total_price, 0);

  const modifiedPartIds = new Set(order.modify_records.map(r => r.part_id));
  
  const effectiveInstalledDiff = order.installed_parts.reduce((diff, part) => {
    if (modifiedPartIds.has(part.part_id)) {
      return diff;
    }
    const configItem = order.config_items.find(
      item => item.part_id === part.part_id || item.part_name === part.part_name
    );
    if (configItem) {
      return diff + (part.total_price - configItem.total_price);
    }
    return diff + part.total_price;
  }, 0);

  const finalTotal = configTotal + modifyTotal + effectiveInstalledDiff;
  const remainingAmount = finalTotal - order.paid_amount;
  const hasPendingDiff = remainingAmount > 0 || effectiveInstalledDiff !== 0;

  const handleConfirmPayment = () => {
    if (confirmAmount > 0) {
      updatePaidAmount(order.id, order.paid_amount + confirmAmount);
      setShowConfirmModal(false);
      setConfirmAmount(0);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">配置原价</p>
              <p className="text-xl font-bold text-gray-800">¥{configTotal.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calculator className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className={`bg-white rounded-xl p-4 shadow-sm ${effectiveInstalledDiff !== 0 ? (effectiveInstalledDiff > 0 ? 'ring-2 ring-green-300' : 'ring-2 ring-red-300') : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">实装差价</p>
              <p className={`text-xl font-bold ${effectiveInstalledDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {effectiveInstalledDiff >= 0 ? '+' : ''}¥{effectiveInstalledDiff.toLocaleString()}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${effectiveInstalledDiff >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <Package className={`w-5 h-5 ${effectiveInstalledDiff >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </div>

        <div className={`bg-white rounded-xl p-4 shadow-sm ${modifyTotal !== 0 ? (modifyTotal > 0 ? 'ring-2 ring-green-300' : 'ring-2 ring-red-300') : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">改配差价</p>
              <p className={`text-xl font-bold ${modifyTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {modifyTotal >= 0 ? '+' : ''}¥{modifyTotal.toLocaleString()}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${modifyTotal >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {modifyTotal >= 0 ? (
                <ArrowUp className="w-5 h-5 text-green-600" />
              ) : (
                <ArrowDown className="w-5 h-5 text-red-600" />
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">最终总价</p>
              <p className="text-xl font-bold text-gray-800">¥{finalTotal.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calculator className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>

        <div className={`bg-white rounded-xl p-4 shadow-sm ${hasPendingDiff ? 'ring-2 ring-orange-300' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">待补金额</p>
              <p className={`text-xl font-bold ${hasPendingDiff ? 'text-orange-600' : 'text-green-600'}`}>
                {hasPendingDiff ? '待补 ' : '已付清 '}¥{remainingAmount.toLocaleString()}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${hasPendingDiff ? 'bg-orange-100' : 'bg-green-100'}`}>
              {hasPendingDiff ? (
                <Clock className="w-5 h-5 text-orange-600" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">配置价格明细（原单）</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {order.config_items.map((item) => (
              <div key={item.id} className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{item.part_name}</p>
                  <p className="text-sm text-gray-500">{item.spec} × {item.quantity}</p>
                </div>
                <span className="font-medium">¥{item.total_price.toLocaleString()}</span>
              </div>
            ))}
            <div className="p-4 bg-gray-50 flex items-center justify-between">
              <span className="font-semibold text-gray-700">配置总价</span>
              <span className="text-lg font-bold text-gray-900">¥{configTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">实装配件价格</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {order.installed_parts.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">暂无实装记录</p>
              </div>
            ) : (
              order.installed_parts.map((part) => {
                const configItem = order.config_items.find(
                  (item) => item.part_name === part.part_name || item.part_id === part.part_id
                );
                const diff = configItem ? part.total_price - configItem.total_price : 0;
                return (
                  <div key={part.id} className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{part.part_name}</p>
                        <p className="text-sm text-gray-500">{part.spec} × {part.quantity}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">¥{part.total_price.toLocaleString()}</span>
                        {diff !== 0 && (
                          <p className={`text-xs ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {diff > 0 ? '+' : ''}{diff}
                          </p>
                        )}
                      </div>
                    </div>
                    {part.remarks && (
                      <p className="text-xs text-orange-600">{part.remarks}</p>
                    )}
                  </div>
                );
              })
            )}
            <div className={`p-4 flex items-center justify-between ${(installedTotal - configTotal) !== 0 ? ((installedTotal - configTotal) > 0 ? 'bg-green-50' : 'bg-red-50') : 'bg-gray-50'}`}>
              <span className="font-semibold text-gray-700">实装总价</span>
              <span className="text-lg font-bold text-gray-900">¥{installedTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">改配差价明细</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {order.modify_records.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">暂无改配记录</p>
              </div>
            ) : (
              order.modify_records.map((record) => {
                const TypeIcon = changeTypeConfig[record.change_type].icon;
                return (
                  <div key={record.id} className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TypeIcon className={`w-4 h-4 ${record.price_diff >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                        <span className="font-medium text-gray-900">{record.part_name}</span>
                      </div>
                      <span className={`font-bold ${record.price_diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {record.price_diff >= 0 ? '+' : ''}¥{record.price_diff.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>¥{record.old_price.toLocaleString()} → ¥{record.new_price.toLocaleString()}</span>
                      <span>{record.created_at}</span>
                    </div>
                  </div>
                );
              })
            )}
            <div className={`p-4 flex items-center justify-between ${modifyTotal !== 0 ? (modifyTotal > 0 ? 'bg-green-50' : 'bg-red-50') : 'bg-gray-50'}`}>
              <span className="font-semibold text-gray-700">改配差价合计</span>
              <span className={`text-lg font-bold ${modifyTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {modifyTotal >= 0 ? '+' : ''}¥{modifyTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {(effectiveInstalledDiff !== 0 || order.installed_parts.length > 0) && (
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-cyan-500">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-cyan-600" />
              实装与原单价格对比
            </h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">原单总价</p>
                <p className="text-xl font-bold text-gray-900">¥{configTotal.toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">实装总价</p>
                <p className="text-xl font-bold text-gray-900">¥{installedTotal.toLocaleString()}</p>
              </div>
              <div className={`text-center p-4 rounded-lg ${(installedTotal - configTotal) >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className="text-sm text-gray-500">原始差异</p>
                <p className={`text-xl font-bold ${(installedTotal - configTotal) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(installedTotal - configTotal) >= 0 ? '+' : ''}¥{(installedTotal - configTotal).toLocaleString()}
                </p>
              </div>
              <div className={`text-center p-4 rounded-lg ${effectiveInstalledDiff >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className="text-sm text-gray-500">有效差额</p>
                <p className={`text-xl font-bold ${effectiveInstalledDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {effectiveInstalledDiff >= 0 ? '+' : ''}¥{effectiveInstalledDiff.toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">
              有效差额 = 实装差价 - 已被改配记录覆盖的部分（避免重复计费）
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasPendingDiff ? (
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
            <h3 className="font-semibold text-gray-800">差价复核状态</h3>
          </div>
          {hasPendingDiff && (
            <button
              onClick={() => setShowConfirmModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              确认收款
            </button>
          )}
        </div>
        <div className="p-6">
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${hasPendingDiff ? 'bg-orange-100' : 'bg-green-100'}`}>
                {hasPendingDiff ? (
                  <Clock className="w-8 h-8 text-orange-600" />
                ) : (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                )}
              </div>
              <p className={`mt-3 font-semibold ${hasPendingDiff ? 'text-orange-600' : 'text-green-600'}`}>
                {hasPendingDiff ? '待确认差价' : '差价已确认'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {hasPendingDiff ? `需客户补缴 ¥${remainingAmount.toLocaleString()}` : '所有差价已结清'}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
                <Calculator className="w-8 h-8 text-blue-600" />
              </div>
              <p className="mt-3 font-semibold text-blue-600">价格变动次数</p>
              <p className="text-sm text-gray-500 mt-1">{order.modify_records.length} 次改配</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-cyan-100 flex items-center justify-center">
                <Package className="w-8 h-8 text-cyan-600" />
              </div>
              <p className="mt-3 font-semibold text-cyan-600">实装配件数</p>
              <p className="text-sm text-gray-500 mt-1">{order.installed_parts.length} 种</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-purple-100 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-purple-600" />
              </div>
              <p className="mt-3 font-semibold text-purple-600">最终确认金额</p>
              <p className="text-sm text-gray-500 mt-1">¥{finalTotal.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">确认收款</h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">待补金额</span>
                    <span className="text-lg font-bold text-orange-600">¥{remainingAmount.toLocaleString()}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">实收金额</label>
                  <input
                    type="number"
                    value={confirmAmount}
                    onChange={(e) => setConfirmAmount(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                    placeholder={`¥${remainingAmount.toLocaleString()}`}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmAmount(remainingAmount)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    全额收取
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmAmount(Math.floor(remainingAmount * 0.5))}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    收取一半
                  </button>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={confirmAmount <= 0}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  确认收款
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
