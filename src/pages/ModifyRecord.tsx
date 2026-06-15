import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, ArrowUp, ArrowDown, RefreshCw, User, Calendar } from 'lucide-react';
import { useStore } from '../store';
import { ModifyRecord as ModifyRecordType } from '../types';

const changeTypeConfig = {
  upgrade: { label: '升级', color: 'bg-green-100 text-green-800', icon: ArrowUp },
  downgrade: { label: '降级', color: 'bg-red-100 text-red-800', icon: ArrowDown },
  replace: { label: '替换', color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
};

export default function ModifyRecordPage() {
  const { id } = useParams<{ id: string }>();
  const { getOrderById, addModifyRecord, parts, currentUser } = useStore();
  const order = getOrderById(id || '');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<Omit<ModifyRecordType, 'id' | 'created_at'>>({
    order_id: id || '',
    part_id: '',
    part_name: '',
    spec: '',
    change_type: 'upgrade',
    old_price: 0,
    new_price: 0,
    price_diff: 0,
    reason: '',
    operator: currentUser?.name || '',
  });

  if (!order) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">订单不存在</p>
      </div>
    );
  }

  const handlePartChange = (partId: string) => {
    const part = parts.find((p) => p.id === partId);
    if (part) {
      setFormData((prev) => ({
        ...prev,
        part_id: part.id,
        part_name: part.name,
        spec: part.spec,
        new_price: part.unit_price,
        price_diff: part.unit_price - prev.old_price,
      }));
    }
  };

  const handleOldPriceChange = (value: number) => {
    setFormData((prev) => ({
      ...prev,
      old_price: value,
      price_diff: prev.new_price - value,
    }));
  };

  const handleNewPriceChange = (value: number) => {
    setFormData((prev) => ({
      ...prev,
      new_price: value,
      price_diff: value - prev.old_price,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.part_id || !formData.reason) return;
    
    addModifyRecord(order.id, formData);
    setShowAddModal(false);
    setFormData({
      order_id: order.id,
      part_id: '',
      part_name: '',
      spec: '',
      change_type: 'upgrade',
      old_price: 0,
      new_price: 0,
      price_diff: 0,
      reason: '',
      operator: currentUser?.name || '',
    });
  };

  const totalPriceDiff = order.modify_records.reduce((sum, record) => sum + record.price_diff, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">改配记录</h2>
            <p className="text-sm text-gray-500 mt-1">订单号：{order.id}</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加改配记录
          </button>
        </div>

        <div className="p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">改配总差价：</span>
            <span className={`text-xl font-bold ${totalPriceDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalPriceDiff >= 0 ? '+' : ''}¥{totalPriceDiff.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {order.modify_records.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500">暂无改配记录</p>
            </div>
          ) : (
            order.modify_records.map((record) => {
              const TypeIcon = changeTypeConfig[record.change_type].icon;
              const typeColor = changeTypeConfig[record.change_type].color;
              const typeLabel = changeTypeConfig[record.change_type].label;

              return (
                <div key={record.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${typeColor}`}>
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColor}`}>
                            {typeLabel}
                          </span>
                          <span className="font-medium text-gray-900">{record.part_name}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{record.spec}</p>
                        <p className="text-sm text-gray-600 mt-2">{record.reason}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>原价格：¥{record.old_price.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>新价格：¥{record.new_price.toLocaleString()}</span>
                      </div>
                      <div className={`text-lg font-bold ${record.price_diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {record.price_diff >= 0 ? '+' : ''}¥{record.price_diff.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                        <User className="w-3 h-3" />
                        <span>{record.operator}</span>
                        <Calendar className="w-3 h-3 ml-2" />
                        <span>{record.created_at}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">添加改配记录</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">变更类型</label>
                <div className="flex gap-2">
                  {Object.entries(changeTypeConfig).map(([key, value]) => {
                    const Icon = value.icon;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, change_type: key as ModifyRecordType['change_type'] }))}
                        className={`flex items-center gap-1 px-3 py-2 rounded-lg border transition-all ${
                          formData.change_type === key
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{value.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">配件选择</label>
                <select
                  value={formData.part_id}
                  onChange={(e) => handlePartChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择配件</option>
                  {parts.map((part) => (
                    <option key={part.id} value={part.id}>
                      {part.name} - {part.spec} (¥{part.unit_price})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">原价格</label>
                  <input
                    type="number"
                    value={formData.old_price}
                    onChange={(e) => handleOldPriceChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">新价格</label>
                  <input
                    type="number"
                    value={formData.new_price}
                    onChange={(e) => handleNewPriceChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">差价</label>
                <div className={`p-3 rounded-lg ${formData.price_diff >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <span className={`text-lg font-bold ${formData.price_diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formData.price_diff >= 0 ? '+' : ''}¥{formData.price_diff.toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">变更原因</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="请输入变更原因，如：客户临时升级内存..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">操作人</label>
                <input
                  type="text"
                  value={formData.operator}
                  onChange={(e) => setFormData((prev) => ({ ...prev, operator: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  确认添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
