import { useState } from 'react';
import Modal from './Modal';
import { useReminderStore } from '../store/reminder';

interface Props {
  open: boolean;
  reminderId: string | null;
  onClose: () => void;
}

export default function ScheduleModal({ open, reminderId, onClose }: Props) {
  const { users, scheduleReminder } = useReminderStore();
  const [scheduledAt, setScheduledAt] = useState('');
  const [assignedCoachId, setAssignedCoachId] = useState('');
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const coaches = users.filter((u) => u.role === 'coach');

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
    if (!reminderId || !scheduledAt || !assignedCoachId) return;
    setSubmitting(true);
    try {
      await scheduleReminder(reminderId, { scheduledAt: localToISO(scheduledAt), assignedCoachId, remark });
      onClose();
      setScheduledAt('');
      setAssignedCoachId('');
      setRemark('');
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} title="安排补训" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            补训时间 <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            指定教练 <span className="text-red-500">*</span>
          </label>
          <select
            value={assignedCoachId}
            onChange={(e) => setAssignedCoachId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent bg-white"
            required
          >
            <option value="">请选择教练</option>
            {coaches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}（{c.phone}）
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">安排备注</label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={3}
            placeholder="请填写场地位置、注意事项等..."
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
            className="px-4 py-2 text-sm text-white bg-navy-800 rounded-sm hover:bg-navy-700 transition-colors disabled:opacity-50"
          >
            {submitting ? '提交中...' : '确认安排'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
