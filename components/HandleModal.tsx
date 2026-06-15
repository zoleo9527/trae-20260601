import { useState } from 'react';
import { X } from 'lucide-react';
import { ComplaintRecord, RejectReason } from '@/data/types';
import { rejectReasonOptions, satisfactionOptions, returnReasonOptions } from '@/data/mockData';

interface HandleModalProps {
  complaint: ComplaintRecord;
  action: 'accept' | 'reject' | 'repair' | 'return_repair' | 'parts' | 'return_parts' | 'revisit' | 'return_revisit';
  onClose: () => void;
  onSubmit: (data: Record<string, string>) => void;
}

export default function HandleModal({ complaint, action, onClose, onSubmit }: HandleModalProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    switch (action) {
      case 'reject':
        if (!formData.reason) newErrors.reason = '请选择驳回原因';
        if (!formData.remark?.trim()) newErrors.remark = '请填写驳回说明';
        break;
      case 'repair':
        if (!formData.content?.trim()) newErrors.content = '请填写维修内容';
        break;
      case 'parts':
        if (!formData.parts?.trim()) newErrors.parts = '请填写准备配件';
        break;
      case 'revisit':
        if (!formData.satisfaction) newErrors.satisfaction = '请选择客户满意度';
        break;
      case 'return_repair':
      case 'return_parts':
      case 'return_revisit':
        if (!formData.reason) newErrors.reason = '请选择退回原因';
        if (!formData.remark?.trim()) newErrors.remark = '请填写补充备注';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit(formData);
    onClose();
  };

  const getTitle = () => {
    const titles: Record<string, string> = {
      accept: '客服受理',
      reject: '驳回工单',
      repair: '完成维修',
      return_repair: '退回补录',
      parts: '配件准备',
      return_parts: '退回补录',
      revisit: '完成回访',
      return_revisit: '退回补录',
    };
    return titles[action] || '处理工单';
  };

  const getFields = () => {
    switch (action) {
      case 'accept':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">处理备注</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                rows={3}
                placeholder="请输入处理备注..."
                value={formData.remark || ''}
                onChange={(e) => handleChange('remark', e.target.value)}
              />
            </div>
          </div>
        );
      
      case 'reject':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">驳回原因 *</label>
              <select
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.reason ? 'border-danger-500' : 'border-gray-300'
                }`}
                value={formData.reason || ''}
                onChange={(e) => handleChange('reason', e.target.value)}
              >
                <option value="">请选择驳回原因</option>
                {rejectReasonOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.reason && <p className="text-danger-500 text-sm mt-1">{errors.reason}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">驳回说明 *</label>
              <textarea
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none ${
                  errors.remark ? 'border-danger-500' : 'border-gray-300'
                }`}
                rows={3}
                placeholder="请输入驳回说明..."
                value={formData.remark || ''}
                onChange={(e) => handleChange('remark', e.target.value)}
              />
              {errors.remark && <p className="text-danger-500 text-sm mt-1">{errors.remark}</p>}
            </div>
          </div>
        );
      
      case 'repair':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">维修内容 *</label>
              <textarea
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none ${
                  errors.content ? 'border-danger-500' : 'border-gray-300'
                }`}
                rows={3}
                placeholder="请输入维修内容..."
                value={formData.content || ''}
                onChange={(e) => handleChange('content', e.target.value)}
              />
              {errors.content && <p className="text-danger-500 text-sm mt-1">{errors.content}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">使用配件</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="多个配件用逗号分隔"
                value={formData.parts || ''}
                onChange={(e) => handleChange('parts', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                rows={2}
                placeholder="请输入备注..."
                value={formData.remark || ''}
                onChange={(e) => handleChange('remark', e.target.value)}
              />
            </div>
          </div>
        );
      
      case 'parts':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">准备配件 *</label>
              <input
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.parts ? 'border-danger-500' : 'border-gray-300'
                }`}
                type="text"
                placeholder="多个配件用逗号分隔"
                value={formData.parts || ''}
                onChange={(e) => handleChange('parts', e.target.value)}
              />
              {errors.parts && <p className="text-danger-500 text-sm mt-1">{errors.parts}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                rows={2}
                placeholder="请输入备注..."
                value={formData.remark || ''}
                onChange={(e) => handleChange('remark', e.target.value)}
              />
            </div>
          </div>
        );
      
      case 'revisit':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">客户满意度 *</label>
              <div className="flex gap-3">
                {satisfactionOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      formData.satisfaction === option.value
                        ? option.color === 'success' ? 'border-success-500 bg-success-50' :
                          option.color === 'warning' ? 'border-warning-500 bg-warning-50' :
                          'border-danger-500 bg-danger-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleChange('satisfaction', option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {errors.satisfaction && <p className="text-danger-500 text-sm mt-1">{errors.satisfaction}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">回访内容</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                rows={3}
                placeholder="请输入回访内容..."
                value={formData.content || ''}
                onChange={(e) => handleChange('content', e.target.value)}
              />
            </div>
          </div>
        );
      
      case 'return_repair':
      case 'return_parts':
      case 'return_revisit':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">退回原因 *</label>
              <select
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.reason ? 'border-danger-500' : 'border-gray-300'
                }`}
                value={formData.reason || ''}
                onChange={(e) => handleChange('reason', e.target.value)}
              >
                <option value="">请选择退回原因</option>
                {returnReasonOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.reason && <p className="text-danger-500 text-sm mt-1">{errors.reason}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">补充备注 *</label>
              <textarea
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none ${
                  errors.remark ? 'border-danger-500' : 'border-gray-300'
                }`}
                rows={3}
                placeholder="请输入退回说明..."
                value={formData.remark || ''}
                onChange={(e) => handleChange('remark', e.target.value)}
              />
              {errors.remark && <p className="text-danger-500 text-sm mt-1">{errors.remark}</p>}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">{getTitle()}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)] scrollbar-thin">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600">
              工单编号: <span className="font-mono">{complaint.id}</span>
            </p>
            <p className="text-sm text-gray-600 mt-1">
              产品: {complaint.productType} - {complaint.productModel}
            </p>
          </div>
          
          {getFields()}
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            确认处理
          </button>
        </div>
      </div>
    </div>
  );
}
