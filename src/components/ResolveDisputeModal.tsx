import { useState, useMemo } from 'react';
import Modal from './Modal';
import { useReminderStore } from '../store/reminder';
import { statusMap } from '../utils/format';
import type { ReminderStatus } from '../../shared/types';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Props {
  open: boolean;
  reminderId: string | null;
  onClose: () => void;
}

const resolveOptions: { value: ReminderStatus; label: string; desc: string }[] = [
  { value: 'pending_confirm', label: '回到待确认', desc: '由报名员重新确认费用' },
  { value: 'pending_execute', label: '回到待执行', desc: '由教练重新执行补训' },
  { value: 'pending_schedule', label: '回到待安排', desc: '由报名员重新安排补训' },
  { value: 'completed', label: '直接完成', desc: '争议解决，直接完成归档' },
];

export default function ResolveDisputeModal({ open, reminderId, onClose }: Props) {
  const { resolveDispute, reminders } = useReminderStore();
  const [resolveTo, setResolveTo] = useState<ReminderStatus>('pending_confirm');
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reminder = useMemo(
    () => reminders.find((r) => r.id === reminderId) || null,
    [reminders, reminderId]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderId || !remark.trim()) return;
    setSubmitting(true);
    try {
      await resolveDispute(reminderId, { remark, resolveTo });
      onClose();
      setResolveTo('pending_confirm');
      setRemark('');
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!reminder) return null;

  return (
    <Modal open={open} title="处理争议" onClose={onClose} width="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-sm">
          <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium text-amber-800">争议处理</div>
            <div className="text-xs text-amber-600 mt-0.5">
              学员：{reminder.student.name} | 科目：{reminder.subject} | 费用：¥{reminder.fee.totalAmount}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            处理结果 <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {resolveOptions.map((opt) => {
              const active = resolveTo === opt.value;
              return (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 border rounded-sm cursor-pointer transition-colors ${
                    active
                      ? 'border-navy-500 bg-navy-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="resolveTo"
                    value={opt.value}
                    checked={active}
                    onChange={() => setResolveTo(opt.value as ReminderStatus)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${active ? 'text-navy-800' : 'text-slate-700'}`}>
                        {opt.label}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-sm ${statusMap[opt.value].className}`}>
                        {statusMap[opt.value].label}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            处理说明 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={4}
            placeholder="请详细说明争议处理结果、责任认定、费用调整等情况..."
            className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent resize-none"
            required
          />
        </div>

        <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-200 rounded-sm">
          <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600">
            处理完成后，状态将自动流转，并明确责任人，确保无责任空档。所有处理记录将写入历史时间线。
          </div>
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
            disabled={submitting || !remark.trim()}
            className="px-4 py-2 text-sm text-white bg-navy-800 rounded-sm hover:bg-navy-700 transition-colors disabled:opacity-50"
          >
            {submitting ? '提交中...' : '确认处理'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
