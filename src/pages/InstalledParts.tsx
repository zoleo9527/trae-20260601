import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Package, User, Calendar, CheckCircle, Clock, Wrench, Edit3, Trash2 } from 'lucide-react';
import { useStore } from '../store';
import { InstalledPart } from '../types';

export default function InstalledParts() {
  const { id } = useParams<{ id: string }>();
  const { getOrderById, addInstalledPart, removeInstalledPart, parts, currentUser } = useStore();
  const order = getOrderById(id || '');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<Omit<InstalledPart, 'id' | 'installed_at'>>({
    order_id: id || '',
    part_id: '',
    part_name: '',
    spec: '',
    quantity: 1,
    unit_price: 0,
    total_price: 0,
    batch_no: '',
    expire_date: '',
    installed_by: currentUser?.name || '',
    remarks: '',
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
        unit_price: part.unit_price,
        total_price: part.unit_price * prev.quantity,
        batch_no: part.batch_no,
        expire_date: part.expire_date,
      }));
    }
  };

  const handleQuantityChange = (value: number) => {
    setFormData((prev) => ({
      ...prev,
      quantity: value,
      total_price: prev.unit_price * value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.part_id) return;

    addInstalledPart(order.id, formData);
    setShowAddModal(false);
    setFormData({
      order_id: order.id,
      part_id: '',
      part_name: '',
      spec: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      batch_no: '',
      expire_date: '',
      installed_by: currentUser?.name || '',
      remarks: '',
    });
  };

  const getPartCategory = (name: string) => {
    if (name.includes('Core') || name.includes('Ryzen')) return 'CPU';
    if (name.includes('DDR') || name.includes('内存')) return '内存';
    if (name.includes('RTX') || name.includes('RX') || name.includes('显卡')) return '显卡';
    if (name.includes('主板') || name.includes('B760') || name.includes('Z790')) return '主板';
    if (name.includes('电源') || name.includes('W') || name.includes('FOCUS')) return '电源';
    if (name.includes('SSD') || name.includes('PRO') || name.includes('硬盘')) return '硬盘';
    return '其他';
  };

  const completedCount = order.installed_parts.length;
  const totalCount = order.config_items.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">实装配件记录</h2>
            <p className="text-sm text-gray-500 mt-1">订单号：{order.id}</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加实装配件
          </button>
        </div>

        <div className="p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">安装进度</span>
            <span className="font-medium">{completedCount}/{totalCount} ({progress}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {order.installed_parts.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">暂无实装记录</p>
              <p className="text-sm text-gray-400 mt-1">装机师可以在此记录实际安装的配件</p>
            </div>
          ) : (
            order.installed_parts.map((part) => (
              <div key={part.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">{getPartCategory(part.part_name)}</span>
                        <span className="font-medium text-gray-900">{part.part_name}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{part.spec}</p>
                      {part.remarks && (
                        <p className="text-sm text-orange-600 mt-2">{part.remarks}</p>
                      )}
                      <div className="flex items-center gap-6 mt-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <span className="font-mono">{part.batch_no}</span>
                        </span>
                        <span>质保至 {part.expire_date}</span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {part.installed_by}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {part.installed_at}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">¥{part.total_price.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">
                      ¥{part.unit_price} × {part.quantity}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeInstalledPart(order.id, part.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">待安装配件（按配置清单）</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {order.config_items.map((item) => {
              const installed = order.installed_parts.find(
                (p) => p.part_name === item.part_name || p.part_id === item.part_id
              );
              const PartIcon = installed ? CheckCircle : Clock;
              const bgColor = installed ? 'bg-green-50' : 'bg-gray-50';
              const iconColor = installed ? 'text-green-600' : 'text-gray-400';

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg ${bgColor} flex items-center justify-between`}
                >
                  <div className="flex items-center gap-3">
                    <PartIcon className={`w-5 h-5 ${iconColor}`} />
                    <div>
                      <p className="font-medium text-gray-900">{item.part_name}</p>
                      <p className="text-xs text-gray-500">{item.spec}</p>
                    </div>
                  </div>
                  <span className={`text-sm ${installed ? 'text-green-600' : 'text-gray-400'}`}>
                    {installed ? '已安装' : '待安装'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">添加实装配件</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择配件</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">数量</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleQuantityChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">单价</label>
                  <input
                    type="number"
                    value={formData.unit_price}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      unit_price: Number(e.target.value),
                      total_price: Number(e.target.value) * prev.quantity,
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">小计</label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-lg font-bold text-gray-900">¥{formData.total_price.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">批次号</label>
                  <input
                    type="text"
                    value={formData.batch_no}
                    onChange={(e) => setFormData((prev) => ({ ...prev, batch_no: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">质保到期</label>
                  <input
                    type="date"
                    value={formData.expire_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, expire_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">安装人</label>
                <input
                  type="text"
                  value={formData.installed_by}
                  onChange={(e) => setFormData((prev) => ({ ...prev, installed_by: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注（可选）</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="如：缺货替换、临时升级等..."
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
                  disabled={!formData.part_id}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
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
