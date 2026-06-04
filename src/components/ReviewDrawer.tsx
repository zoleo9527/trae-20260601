import { useState } from 'react';
import { FileCheck, AlertCircle } from 'lucide-react';
import { Drawer } from './Drawer';
import { api } from '../utils/api';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';
import type { PrescriptionDetail } from '../../shared/types';

interface ReviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  prescription: PrescriptionDetail;
  onSuccess: () => void;
}

export function ReviewDrawer({ isOpen, onClose, prescription, onSuccess }: ReviewDrawerProps) {
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
      await api.reviewPrescription(prescription.id, {
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
    <Drawer isOpen={isOpen} onClose={onClose} title="处方审核">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
          <div className="flex items-center gap-2 text-teal-700">
            <FileCheck className="w-4 h-4" />
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
          <label className="block text-sm font-medium text-slate-700 mb-2">审核意见</label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="请输入审核意见（如处方配伍合理性、特殊注意事项等）"
            rows={4}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors resize-none"
          />
          <p className="mt-1 text-xs text-slate-400">
            审核通过后，处方将自动转入待煎药队列，审核意见将同步至后续所有环节
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
            {loading ? '处理中...' : '审核通过'}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
