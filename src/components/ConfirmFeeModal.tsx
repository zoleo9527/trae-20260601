import { useState, useMemo } from 'react';
import Modal from './Modal';
import { useReminderStore } from '../store/reminder';
import { paymentMap } from '../utils/format';
import type { Reminder } from '../../shared/types';

interface Props {
  open: boolean;
  reminder: Reminder | null;
  onClose: () => void;
}

export default function ConfirmFeeModal({ open, reminder, onClose }: Props) {
  const { confirmFee, currentUserId, users } = useReminderStore();
  const currentUser = useMemo(() => users.find((u) => u.id === currentUserId), [users, currentUserId]);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending' | 'unpaid'>('paid');
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminder) return;
    setSubmitting(true);
    try {
      await confirmFee(reminder.id, {
        paymentStatus,
        confirmedBy: currentUser?.name || '系统',
        remark,
      });
      onClose();
      setPaymentStatus('paid');
      setRemark('');
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!reminder) return null;

  return (
    <Modal open={open} title="费用确认" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-slate-50 border border-slate-200 rounded-sm p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">学员</span>
            <span className="font-medium text-slate-800">{reminder.student.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">补训科目</span>
            <span className="font-medium text-slate-800">{reminder.subject}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">补训课时</span>
            <span className="font-medium text-slate-800">{reminder.makeupHours} 课时</span>
          </div>
          <div className="border-t border-slate-200 my-2" />
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">基础费用</span>
            <span className="text-slate-800">¥{reminder.fee.baseFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">加时费用</span>
            <span className="text-slate-800">¥{reminder.fee.extraHoursFee.toFixed(2)}</span>
          </div>
          {reminder.fee.materialFee ? (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">材料费</span>
              <span className="text-slate-800">¥{reminder.fee.materialFee.toFixed(2)}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-base pt-1">
            <span className="font-semibold text-navy-800">合计应收</span>
            <span className="font-bold text-accent-dark text-lg">
              ¥{reminder.fee.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            缴费状态 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3">
            {(['paid', 'pending', 'unpaid'] as const).map((s) => (
              <label
                key={s}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-sm cursor-pointer text-sm transition-colors ${
                  paymentStatus === s
                    ? 'border-navy-500 bg-navy-50 text-navy-700 font-medium'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value={s}
                  checked={paymentStatus === s}
                  onChange={() => setPaymentStatus(s)}
                  className="sr-only"
                />
                <span className={paymentMap[s].className}>{paymentMap[s].label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">确认备注</label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={3}
            placeholder="缴费方式（现金/微信/支付宝/转账）、收据编号等..."
            className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-sm hover:bg-slate-200 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-sm text-white bg-emerald-600 rounded-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {submitting ? '提交中...' : '确认完成'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
