import { useState } from 'react';
import { X, Phone, User, MessageSquare } from 'lucide-react';
import type { Complaint } from '../types';

interface FollowupModalProps {
  complaint: Complaint;
  onSubmit: (complaintId: string, followupNote: string) => void;
  onClose: () => void;
}

export function FollowupModal({ complaint, onSubmit, onClose }: FollowupModalProps) {
  const [formData, setFormData] = useState({
    followupBy: '',
    followupNote: '',
    followupResult: 'resolved' as 'resolved' | 'pending'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(complaint.id, formData.followupNote);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">记录回访</h2>
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
            <label className="block text-sm text-gray-400 mb-1">回访人（客服）</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500"/>
              <input
                type="text"
                name="followupBy"
                value={formData.followupBy}
                onChange={handleChange}
                placeholder="如 刘客服"
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">回访结果</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, followupResult: 'resolved' }))}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg border transition-colors ${
                  formData.followupResult === 'resolved'
                    ? 'border-green-500 bg-green-500/20 text-green-300'
                    : 'border-slate-600 bg-slate-700 text-gray-300 hover:border-slate-500'
                }`}
              >
                <Phone className="h-4 w-4"/>
                <span>已解决</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, followupResult: 'pending' }))}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg border transition-colors ${
                  formData.followupResult === 'pending'
                    ? 'border-yellow-500 bg-yellow-500/20 text-yellow-300'
                    : 'border-slate-600 bg-slate-700 text-gray-300 hover:border-slate-500'
                }`}
              >
                <Phone className="h-4 w-4"/>
                <span>待跟进</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">回访记录</label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-500"/>
              <textarea
                name="followupNote"
                value={formData.followupNote}
                onChange={handleChange}
                placeholder="请记录回访内容，如：客人表示满意，问题已解决..."
                rows={4}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none"
                required
              />
            </div>
          </div>

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
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors"
            >
              完成回访
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
