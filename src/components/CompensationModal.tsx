import { useState } from 'react';
import { X, Gift, Percent, Ticket, Package, AlertTriangle } from 'lucide-react';
import type { Complaint, CompensateType } from '../types';
import { compensateTypeMap } from '../data/mockData';

interface CompensationModalProps {
  complaint: Complaint;
  onSubmit: (compensationData: {
    complaintId: string;
    type: CompensateType;
    amount: number;
    description: string;
    authorizedBy: string;
    isAbnormal: boolean;
    abnormalReason?: string;
  }) => void;
  onClose: () => void;
}

export function CompensationModal({ complaint, onSubmit, onClose }: CompensationModalProps) {
  const [formData, setFormData] = useState({
    type: 'drinks' as CompensateType,
    amount: 1,
    description: '',
    authorizedBy: '',
    isAbnormal: false,
    abnormalReason: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      complaintId: complaint.id
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setFormData(prev => ({
      ...prev,
      amount: value
    }));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'drinks': return <Gift className="h-4 w-4"/>;
      case 'discount': return <Percent className="h-4 w-4"/>;
      case 'free_entry': return <Ticket className="h-4 w-4"/>;
      case 'storage': return <Package className="h-4 w-4"/>;
      default: return <Gift className="h-4 w-4"/>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">添加补偿</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400"/>
          </button>
        </div>

        <div className="px-6 py-3 bg-slate-700/50 border-b border-slate-700">
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-gray-400">投诉编号:</span>
            <span className="text-white font-medium">#{complaint.id}</span>
            <span className="text-gray-400">桌台:</span>
            <span className="text-white">{complaint.tableNumber}</span>
            <span className="text-gray-400">客人:</span>
            <span className="text-white">{complaint.customerName}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">补偿类型</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(compensateTypeMap) as [CompensateType, string][]).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: key }))}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg border transition-colors ${
                    formData.type === key
                      ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                      : 'border-slate-600 bg-slate-700 text-gray-300 hover:border-slate-500'
                  }`}
                >
                  {getTypeIcon(key)}
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              数量/金额
              {formData.type === 'discount' && <span className="text-gray-500">（元）</span>}
              {formData.type === 'drinks' && <span className="text-gray-500">（杯/瓶）</span>}
              {formData.type === 'free_entry' && <span className="text-gray-500">（人次）</span>}
            </label>
            <input
              type="number"
              min="1"
              value={formData.amount}
              onChange={handleAmountChange}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">补偿描述</label>
            <textarea
              value={formData.description}
              onChange={handleChange}
              name="description"
              placeholder="请描述具体补偿内容..."
              rows={2}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">授权人（经理）</label>
            <input
              type="text"
              name="authorizedBy"
              value={formData.authorizedBy}
              onChange={handleChange}
              placeholder="如 李经理"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isAbnormal"
              name="isAbnormal"
              checked={formData.isAbnormal}
              onChange={handleChange}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="isAbnormal" className="flex items-center space-x-2 text-gray-300">
              <AlertTriangle className="h-4 w-4 text-orange-400"/>
              <span>异常核销（超权限或特殊情况）</span>
            </label>
          </div>

          {formData.isAbnormal && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">异常原因</label>
              <input
                type="text"
                name="abnormalReason"
                value={formData.abnormalReason}
                onChange={handleChange}
                placeholder="请说明异常原因，如：单次赠饮超过5杯上限"
                className="w-full px-4 py-2 bg-slate-700 border border-orange-500/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                required
              />
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-white transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors ${
                formData.isAbnormal
                  ? 'bg-orange-600 hover:bg-orange-500'
                  : 'bg-green-600 hover:bg-green-500'
              }`}
            >
              {formData.isAbnormal ? '确认异常补偿' : '确认补偿'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
