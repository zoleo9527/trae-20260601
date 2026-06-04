import { useState } from 'react';
import { Flame, AlertCircle } from 'lucide-react';
import { Drawer } from './Drawer';
import { api } from '../utils/api';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';
import type { PrescriptionDetail } from '../../shared/types';

interface DecoctDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  prescription: PrescriptionDetail;
  onSuccess: () => void;
}

export function DecoctDrawer({ isOpen, onClose, prescription, onSuccess }: DecoctDrawerProps) {
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const operatorName = useAppStore((state) => state.operatorName);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!operatorName.trim()) {
      setError('请先在右上角设置操作员姓名');
      return;
    }

    setLoading(true);
    try {
      await api.decoctPrescription(prescription.id, {
        operatorName,
        remark: remark.trim(),
      });
      onSuccess();
      onClose();
      setRemark('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="煎药完成">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
          <div className="flex items-center gap-2 text-teal-700">
            <Flame className="w-4 h-4" />
            <span className="text-sm font-medium">处方信息</span>
          </div>
          <div className="mt-2 space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-slate-500">处方编号</div>
              <div className="font-medium text-slate-900">{prescription.prescriptionNo}</div>
              <div className="text-slate-500">患者</div>
              <div className="font-medium text-slate-900">
                {prescription.patientName} {prescription.patientGender} {prescription.patientAge}岁
              </div>
              <div className="text-slate-500">诊断</div>
              <div className="font-medium text-slate-900">{prescription.diagnosis}</div>
            </div>
            <div className="pt-2 border-t border-teal-200">
              <div className="text-slate-500 mb-1">处方内容</div>
              <div className="p-2 bg-white rounded border border-teal-200 text-slate-700">
                {prescription.prescriptionContent}
              </div>
            </div>
            <div>
              <div className="text-slate-500 mb-1">用法用量</div>
              <div className="p-2 bg-white rounded border border-teal-200 text-slate-700">
                {prescription.dosage}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">煎药备注</label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="请输入煎药相关备注（如煎药数量、特殊煎法、包装情况等）"
            rows={4}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors resize-none"
          />
          <p className="mt-1 text-xs text-slate-400">
            煎药完成后，处方将自动转入待配送队列，煎药备注将同步至后续所有环节
          </p>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-medium"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className={cn(
              'flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors',
              loading
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-teal-600 text-white hover:bg-teal-700'
            )}
          >
            {loading ? '处理中...' : '标记煎药完成'}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
