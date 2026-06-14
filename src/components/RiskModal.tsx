import { useState } from 'react';
import Modal from './Modal';
import { useReminderStore } from '../store/reminder';
import { riskLevelMap, riskCategoryMap } from '../utils/format';
import type { RiskLevel, RiskCategory } from '../../shared/types';

interface Props {
  open: boolean;
  reminderId: string | null;
  onClose: () => void;
}

export default function RiskModal({ open, reminderId, onClose }: Props) {
  const { markRisk } = useReminderStore();
  const [level, setLevel] = useState<RiskLevel>('medium');
  const [category, setCategory] = useState<RiskCategory>('process_irregularity');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderId || !reason.trim()) return;
    setSubmitting(true);
    try {
      await markRisk(reminderId, {
        level,
        category,
        reason: reason.trim(),
      });
      onClose();
      setReason('');
      setLevel('medium');
      setCategory('process_irregularity');
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} title="标记责任风险" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-sm px-3 py-2 text-xs text-amber-700">
          标记责任风险后，该记录将被重点关注。请如实描述风险情况，便于后续责任追溯和问题整改。
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            风险等级 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['low', 'medium', 'high', 'critical'] as RiskLevel[]).map((lv) => (
              <button
                key={lv}
                type="button"
                onClick={() => setLevel(lv)}
                className={`px-2 py-1.5 text-xs rounded-sm border font-medium transition-colors ${
                  level === lv
                    ? `${riskLevelMap[lv].badgeClass} ring-2 ring-offset-1 ring-amber-400`
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {riskLevelMap[lv].label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            风险类别 <span className="text-red-500">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as RiskCategory)}
            className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          >
            {Object.entries(riskCategoryMap).map(([key, val]) => (
              <option key={key} value={key}>
                {val.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-400 mt-1">{riskCategoryMap[category]?.description}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            风险说明 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="请详细描述风险情况：涉及问题、可能影响、责任方等..."
            className="w-full px-3 py-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
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
            disabled={submitting || !reason.trim()}
            className="px-4 py-2 text-sm text-white bg-amber-600 rounded-sm hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            {submitting ? '提交中...' : '确认标记'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
