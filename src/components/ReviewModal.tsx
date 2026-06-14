import { useState } from 'react';
import Modal from './Modal';
import { useReminderStore } from '../store/reminder';
import { CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  open: boolean;
  reminderId: string | null;
  type: 'approve' | 'reject';
  onClose: () => void;
}

export default function ReviewModal({ open, reminderId, type, onClose }: Props) {
  const { reviewReminder } = useReminderStore();
  const [remark, setRemark] = useState(type === 'approve' ? '流程合规，资料完整，同意归档' : '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderId) return;
    setSubmitting(true);
    try {
      await reviewReminder(reminderId, { remark, approve: type === 'approve' });
      onClose();
      setRemark(type === 'approve' ? '流程合规，资料完整，同意归档' : '');
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const title = type === 'approve' ? '审核通过' : '审核驳回';
  const btnClass = type === 'approve' ? 'bg-navy-800 hover:bg-navy-700' : 'bg-red-600 hover:bg-red-700';
  const iconColor = type === 'approve' ? 'text-emerald-600' : 'text-red-600';
  const Icon = type === 'approve' ? CheckCircle2 : XCircle;

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className={`flex items-center gap-3 p-3 rounded-sm ${type === 'approve' ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
          <Icon size={24} className={iconColor} />
          <div className="text-sm">
            <div className={`font-medium ${type === 'approve' ? 'text-emerald-700' : 'text-red-700'}`}>
              {type === 'approve' ? '确认审核通过？' : '确认审核驳回？'}
            </div>
            <div className={`text-xs mt-0.5 ${type === 'approve' ? 'text-emerald-600' : 'text-red-600'}`}>
              {type === 'approve' ? '审核通过后，记录将标记为安全合规' : '驳回后需注明原因，由相关责任人整改后重新提交'}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            审核备注 {type === 'reject' && <span className="text-red-500">*</span>}
          </label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={4}
            placeholder={type === 'approve' ? '请填写审核意见（可选）...' : '请填写驳回原因...'}
            className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent resize-none"
            required={type === 'reject'}
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
            disabled={submitting || (type === 'reject' && !remark.trim())}
            className={`px-4 py-2 text-sm text-white rounded-sm transition-colors disabled:opacity-50 ${btnClass}`}
          >
            {submitting ? '提交中...' : `确认${title}`}
          </button>
        </div>
      </form>
    </Modal>
  );
}
