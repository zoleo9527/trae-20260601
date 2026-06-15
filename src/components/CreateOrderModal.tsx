import { useState } from 'react';
import { useAppStore } from '../store';
import { X } from 'lucide-react';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateOrderModal({ isOpen, onClose }: CreateOrderModalProps) {
  const createOrder = useAppStore((state) => state.createOrder);
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    addressFrom: '',
    addressTo: '',
    scheduledTime: '',
    baseFee: 0,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.phone || !formData.addressFrom || !formData.addressTo || !formData.scheduledTime) {
      alert('请填写完整信息');
      return;
    }
    await createOrder({
      ...formData,
      status: 'reserved',
    });
    onClose();
    setFormData({
      customerName: '',
      phone: '',
      addressFrom: '',
      addressTo: '',
      scheduledTime: '',
      baseFee: 0,
    });
  };

  const now = new Date().toISOString().slice(0, 16);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">新建订单</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">客户姓名</label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="请输入客户姓名"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="请输入联系电话"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">出发地址</label>
            <input
              type="text"
              value={formData.addressFrom}
              onChange={(e) => setFormData({ ...formData, addressFrom: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="请输入出发地址"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">目的地地址</label>
            <input
              type="text"
              value={formData.addressTo}
              onChange={(e) => setFormData({ ...formData, addressTo: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="请输入目的地地址"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">预约时间</label>
            <input
              type="datetime-local"
              value={formData.scheduledTime}
              onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              min={now}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">基础费用 (元)</label>
            <input
              type="number"
              value={formData.baseFee}
              onChange={(e) => setFormData({ ...formData, baseFee: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="请输入基础费用"
              min={0}
              step={0.01}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
          >
            创建订单
          </button>
        </form>
      </div>
    </div>
  );
}
