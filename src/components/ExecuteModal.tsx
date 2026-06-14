import { useState } from 'react';
import Modal from './Modal';
import { useReminderStore } from '../store/reminder';

interface Props {
  open: boolean;
  reminderId: string | null;
  onClose: () => void;
}

function defaultDateTime() {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ExecuteModal({ open, reminderId, onClose }: Props) {
  const { executeReminder } = useReminderStore();
  const [executedAt, setExecutedAt] = useState(defaultDateTime());
  const [executedRemark, setExecutedRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function localToISO(localStr: string): string {
    if (!localStr) return '';
    const d = new Date(localStr);
    const offset = -d.getTimezoneOffset();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const sign = offset >= 0 ? '+' : '-';
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00${sign}${pad(Math.floor(Math.abs(offset) / 60))}:${pad(Math.abs(offset) % 60)}`;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderId || !executedAt) return;
    setSubmitting(true);
    try {
      await executeReminder(reminderId, { executedAt: localToISO(executedAt), executedRemark });
      onClose();
      setExecutedAt(defaultDateTime());
      setExecutedRemark('');
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} title="执行补训完成" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            实际执行时间 <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={executedAt}
            onChange={(e) => setExecutedAt(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            执行记录 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={executedRemark}
            onChange={(e) => setExecutedRemark(e.target.value)}
            rows={4}
            placeholder="请记录本次补训的实际内容、学员掌握情况、是否可安排补考等..."
            className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent resize-none"
            required
          />
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-sm px-3 py-2 text-xs text-amber-700">
          提交后状态将流转为「待确认」，由报名员负责确认费用
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
            className="px-4 py-2 text-sm text-white bg-accent rounded-sm hover:bg-accent-dark transition-colors disabled:opacity-50"
          >
            {submitting ? '提交中...' : '确认完成'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
