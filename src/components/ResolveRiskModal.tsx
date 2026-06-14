import { useState } from 'react';
import Modal from './Modal';
import { useReminderStore } from '../store/reminder';

interface Props {
  open: boolean;
  reminderId: string | null;
  riskId: string;
  onClose: () => void;
}

export default function ResolveRiskModal({ open, reminderId, riskId, onClose }: Props) {
  const { resolveRisk } = useReminderStore();
  const [resolveRemark, setResolveRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderId || !riskId || !resolveRemark.trim()) return;
    setSubmitting(true);
    try {
      await resolveRisk(reminderId, riskId, resolveRemark.trim());
      onClose();
      setResolveRemark('');
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} title="解除风险标记" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-sm px-3 py-2 text-xs text-emerald-700">
          解除风险标记后，该记录的风险等级将重新评估。请详细说明风险处理情况，确保问题已妥善解决。
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            解除说明 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={resolveRemark}
            onChange={(e) => setResolveRemark(e.target.value)}
            rows={4}
            placeholder="请说明风险处理情况、整改措施、责任认定等..."
            className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent resize-none"
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
            disabled={submitting || !resolveRemark.trim()}
            className="px-4 py-2 text-sm text-white bg-emerald-600 rounded-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {submitting ? '提交中...' : '确认解除'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
