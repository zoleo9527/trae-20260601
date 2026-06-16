import { useState } from 'react';
import { X, User, Phone, MapPin, FileText, AlertCircle } from 'lucide-react';
import type { Complaint, ComplaintType } from '../types';
import { complaintTypeMap } from '../data/mockData';

interface ComplaintFormProps {
  onSubmit: (complaintData: Omit<Complaint, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}

export function ComplaintForm({ onSubmit, onClose }: ComplaintFormProps) {
  const [formData, setFormData] = useState({
    tableNumber: '',
    customerName: '',
    customerPhone: '',
    complaintType: 'other' as ComplaintType,
    complaintReason: '',
    managerName: '',
    tableArea: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
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
          <h2 className="text-xl font-semibold text-white">登记投诉</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400"/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">桌台编号</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500"/>
                <input
                  type="text"
                  name="tableNumber"
                  value={formData.tableNumber}
                  onChange={handleChange}
                  placeholder="如 A01"
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">区域</label>
              <input
                type="text"
                name="tableArea"
                value={formData.tableArea}
                onChange={handleChange}
                placeholder="如 A区"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">客人姓名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500"/>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  placeholder="请输入姓名"
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">联系电话</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500"/>
                <input
                  type="text"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleChange}
                  placeholder="如 138****1234"
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">投诉类型</label>
            <select
              name="complaintType"
              value={formData.complaintType}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              {Object.entries(complaintTypeMap).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">投诉原因</label>
            <div className="relative">
              <AlertCircle className="absolute left-3 top-3 h-4 w-4 text-gray-500"/>
              <textarea
                name="complaintReason"
                value={formData.complaintReason}
                onChange={handleChange}
                placeholder="请详细描述投诉原因..."
                rows={3}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">登记人（经理）</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500"/>
              <input
                type="text"
                name="managerName"
                value={formData.managerName}
                onChange={handleChange}
                placeholder="如 李经理"
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
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
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white transition-colors"
            >
              提交投诉
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
