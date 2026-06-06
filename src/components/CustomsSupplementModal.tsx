import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, FileText } from 'lucide-react';
import type { CustomsDoc } from '@/types';

interface CustomsSupplementModalProps {
  visible: boolean;
  doc?: CustomsDoc;
  onClose: () => void;
  onSubmit: (docId: string, supplementItems: string[], remark: string) => void;
}

export const CustomsSupplementModal: React.FC<CustomsSupplementModalProps> = ({
  visible,
  doc,
  onClose,
  onSubmit,
}) => {
  const [supplementItems, setSupplementItems] = useState<string[]>(['']);
  const [remark, setRemark] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      setSupplementItems(['']);
      setRemark('');
      setErrors([]);
    }
  }, [visible]);

  const handleAddItem = () => {
    setSupplementItems([...supplementItems, '']);
  };

  const handleRemoveItem = (index: number) => {
    if (supplementItems.length <= 1) {
      return;
    }
    const newItems = supplementItems.filter((_, i) => i !== index);
    setSupplementItems(newItems);
  };

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...supplementItems];
    newItems[index] = value;
    setSupplementItems(newItems);
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = () => {
    const validItems = supplementItems.filter(item => item.trim() !== '');
    if (validItems.length === 0) {
      setErrors(['请至少填写一个补件项']);
      return;
    }
    if (doc) {
      onSubmit(doc.id, validItems, remark);
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">报关补件</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {doc && (
            <div className="bg-blue-50 rounded-lg p-3">
              <span className="text-sm text-gray-600">报关单号：</span>
              <span className="text-sm font-medium text-blue-700">{doc.docNo}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              补件项 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {supplementItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleItemChange(index, e.target.value)}
                    placeholder={`请输入补件项 ${index + 1}`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => handleRemoveItem(index)}
                    disabled={supplementItems.length <= 1}
                    className="p-2 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={handleAddItem}
              className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加补件项
            </button>
            {errors.length > 0 && (
              <div className="mt-2">
                {errors.map((error, index) => (
                  <p key={index} className="text-sm text-red-500">
                    {error}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              补件说明
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="请输入补件说明（可选）"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            提交
          </button>
        </div>
      </div>
    </div>
  );
};
