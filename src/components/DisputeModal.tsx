import { useState } from 'react';
import Modal from './Modal';
import { useReminderStore } from '../store/reminder';

interface Props {
  open: boolean;
  reminderId: string | null;
  onClose: () => void;
}

export default function DisputeModal({ open, reminderId, onClose }: Props) {
  const { markDispute } = useReminderStore();
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderId || !remark.trim()) return;
    setSubmitting(true);
    try {
      await markDispute(reminderId, remark);
      onClose();
      setRemark('');
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} title="标记争议" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-sm px-3 py-2 text-xs text-red-700">
          标记为争议后，将自动交由安全员介入处理，请务必详细说明争议原因。
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            争议原因 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={4}
            placeholder="请详细描述争议内容：涉及金额、学员诉求、责任认定分歧等..."
            className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none"
            required
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
            className="px-4 py-2 text-sm text-white bg-red-600 rounded-sm hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {submitting ? '提交中...' : '确认标记'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
