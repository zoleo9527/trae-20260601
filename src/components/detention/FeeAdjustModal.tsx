import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { useStore } from '@/store/useStore';
import { formatCurrency } from '@/utils/format';

interface FeeAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  detentionId: string;
  currentFee: number;
}

export const FeeAdjustModal = ({ isOpen, onClose, detentionId, currentFee }: FeeAdjustModalProps) => {
  const [newFee, setNewFee] = useState(currentFee.toString());
  const [remark, setRemark] = useState('');
  const adjustDetentionFee = useStore((state) => state.adjustDetentionFee);
  const currentUser = useStore((state) => state.currentUser);

  const handleSubmit = () => {
    const fee = parseFloat(newFee);
    if (isNaN(fee) || fee < 0) return;
    adjustDetentionFee(detentionId, fee, remark, currentUser.name, currentUser.role);
    onClose();
  };

  const diff = parseFloat(newFee) - currentFee;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="调整滞留费用"
      size="md"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            确认调整
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">当前费用</span>
            <span className="text-lg font-semibold text-gray-900">{formatCurrency(currentFee)}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">调整后费用</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
            <input
              type="number"
              value={newFee}
              onChange={(e) => setNewFee(e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.01"
              min="0"
            />
          </div>
          {!isNaN(parseFloat(newFee)) && parseFloat(newFee) !== currentFee && (
            <p className={`mt-2 text-sm ${diff < 0 ? 'text-green-600' : 'text-red-600'}`}>
              {diff < 0 ? '减少' : '增加'} {formatCurrency(Math.abs(diff))}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">调整原因</label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={3}
            placeholder="请填写调整原因，该记录会保存到操作日志中"
            className="w-full px-3 py-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>
    </Modal>
  );
};
