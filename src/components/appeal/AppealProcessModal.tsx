import { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { useStore } from '@/store/useStore';
import { AppealStatus } from '@/types';
import { formatCurrency } from '@/utils/format';

interface AppealProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  appealId: string;
  onProcessed?: () => void;
}

export const AppealProcessModal = ({ isOpen, onClose, appealId, onProcessed }: AppealProcessModalProps) => {
  const [result, setResult] = useState<'approved' | 'rejected'>('approved');
  const [remark, setRemark] = useState('');
  const [adjustFee, setAdjustFee] = useState('');
  const { processAppealAndAdjustFee, currentUser, getAppealById, getNextPendingAppeal } = useStore();

  const appeal = getAppealById(appealId);
  const nextPending = getNextPendingAppeal(appealId);

  useEffect(() => {
    if (isOpen && appeal) {
      setResult('approved');
      setRemark('');
      const suggestedFee = Math.max(0, (appeal.detention?.feeAmount || 0) - appeal.requestedAdjustment);
      setAdjustFee(suggestedFee.toFixed(2));
    }
  }, [isOpen, appealId, appeal]);

  const handleSubmit = () => {
    if (!appeal) return;

    const resultText = result === 'approved' ? '申诉通过' : '申诉驳回';
    const newFee = result === 'approved' && adjustFee ? parseFloat(adjustFee) : null;

    processAppealAndAdjustFee(
      appealId,
      result as AppealStatus,
      newFee,
      resultText,
      remark,
      currentUser.name,
      currentUser.role
    );

    onClose();
    onProcessed?.();
  };

  const originalFee = appeal?.detention?.feeAmount || 0;
  const requestedAdjustment = appeal?.requestedAdjustment || 0;
  const adjustedFee = parseFloat(adjustFee) || 0;
  const actualAdjustment = result === 'approved' ? Math.max(0, originalFee - adjustedFee) : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="处理司机申诉"
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          {nextPending && (
            <span className="text-xs text-gray-500">
              还有 {nextPending ? 1 : 0} 条待处理
            </span>
          )}
          <div className="flex items-center gap-3 ml-auto">
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
              提交处理
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {appeal && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">司机：</span>
                <span className="text-gray-900 font-medium">{appeal.driverName}</span>
              </div>
              <div>
                <span className="text-gray-500">关联订单：</span>
                <span className="text-gray-900 font-medium">{appeal.detention?.orderNo}</span>
              </div>
              <div>
                <span className="text-gray-500">当前费用：</span>
                <span className="text-gray-900 font-medium">{formatCurrency(originalFee)}</span>
              </div>
              <div>
                <span className="text-gray-500">申请减免：</span>
                <span className="text-orange-600 font-medium">{formatCurrency(requestedAdjustment)}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-1">申诉理由：</p>
              <p className="text-sm text-gray-700">{appeal.appealReason}</p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">处理结果</label>
          <div className="flex gap-3">
            <label className="flex-1">
              <input
                type="radio"
                name="result"
                value="approved"
                checked={result === 'approved'}
                onChange={(e) => setResult(e.target.value as 'approved' | 'rejected')}
                className="sr-only"
              />
              <div className={`p-4 border rounded cursor-pointer transition-all ${
                result === 'approved'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <p className="text-sm font-medium text-gray-900">申诉通过</p>
                <p className="text-xs text-gray-500 mt-1">根据实际情况调整费用</p>
              </div>
            </label>
            <label className="flex-1">
              <input
                type="radio"
                name="result"
                value="rejected"
                checked={result === 'rejected'}
                onChange={(e) => setResult(e.target.value as 'approved' | 'rejected')}
                className="sr-only"
              />
              <div className={`p-4 border rounded cursor-pointer transition-all ${
                result === 'rejected'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <p className="text-sm font-medium text-gray-900">申诉驳回</p>
                <p className="text-xs text-gray-500 mt-1">维持原费用不变</p>
              </div>
            </label>
          </div>
        </div>

        {result === 'approved' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">调整后费用</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
              <input
                type="number"
                value={adjustFee}
                onChange={(e) => setAdjustFee(e.target.value)}
                placeholder="请输入调整后的费用金额"
                className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.01"
                min="0"
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-gray-500">
                司机申请减免: {formatCurrency(requestedAdjustment)}
              </span>
              {adjustedFee > 0 && originalFee > 0 && (
                <span className={actualAdjustment > 0 ? 'text-green-600' : 'text-gray-500'}>
                  实际减免: {formatCurrency(actualAdjustment)}
                </span>
              )}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">处理意见</label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={3}
            placeholder="请填写详细的处理意见，该记录会保存到状态日志中"
            className="w-full px-3 py-2.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>
    </Modal>
  );
};
