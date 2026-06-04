import { useState } from 'react';
import { Package, Upload, AlertCircle } from 'lucide-react';
import { Drawer } from './Drawer';
import { api } from '../utils/api';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';
import type { PrescriptionDetail } from '../../shared/types';

interface DeliveryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  prescription: PrescriptionDetail;
  onSuccess: () => void;
}

const courierCompanies = ['顺丰速运', '京东物流', '圆通速递', '中通快递', '申通快递', '韵达速递', '极兔速递'];

export function DeliveryDrawer({ isOpen, onClose, prescription, onSuccess }: DeliveryDrawerProps) {
  const [courierCompany, setCourierCompany] = useState('');
  const [trackingNo, setTrackingNo] = useState('');
  const [deliveryRemark, setDeliveryRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const operatorName = useAppStore((state) => state.operatorName);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!courierCompany.trim()) {
      setError('请选择快递公司');
      return;
    }
    if (!trackingNo.trim()) {
      setError('请输入快递单号');
      return;
    }
    if (!operatorName.trim()) {
      setError('请先在右上角设置操作员姓名');
      return;
    }

    setLoading(true);
    try {
      await api.deliveryPrescription(prescription.id, {
        operatorName,
        courierCompany: courierCompany.trim(),
        trackingNo: trackingNo.trim(),
        deliveryRemark: deliveryRemark.trim(),
      });
      onSuccess();
      onClose();
      setCourierCompany('');
      setTrackingNo('');
      setDeliveryRemark('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="配送出库处理">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
          <div className="flex items-center gap-2 text-teal-700">
            <Package className="w-4 h-4" />
            <span className="text-sm font-medium">处方信息</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div className="text-slate-500">处方编号</div>
            <div className="font-medium text-slate-900">{prescription.prescriptionNo}</div>
            <div className="text-slate-500">患者姓名</div>
            <div className="font-medium text-slate-900">{prescription.patientName}</div>
            <div className="text-slate-500">诊断</div>
            <div className="font-medium text-slate-900">{prescription.diagnosis}</div>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              快递公司 <span className="text-red-500">*</span>
            </label>
            <select
              value={courierCompany}
              onChange={(e) => setCourierCompany(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors bg-white"
            >
              <option value="">请选择快递公司</option>
              {courierCompanies.map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              快递单号 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={trackingNo}
              onChange={(e) => setTrackingNo(e.target.value)}
              placeholder="请输入快递单号"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">配送备注</label>
            <textarea
              value={deliveryRemark}
              onChange={(e) => setDeliveryRemark(e.target.value)}
              placeholder="请输入配送相关备注信息（如特殊配送要求、注意事项等）"
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors resize-none"
            />
            <p className="mt-1 text-xs text-slate-400">
              备注将同步至后续签收回查环节，供所有环节查看
            </p>
          </div>

          <div className="pt-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">附件上传</label>
            <div className="grid grid-cols-3 gap-3">
              {['处方照片', '煎药标签', '快递单'].map((label) => (
                <div
                  key={label}
                  className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-teal-400 hover:bg-teal-50 transition-colors cursor-pointer"
                >
                  <Upload className="w-6 h-6 text-slate-400" />
                  <span className="mt-1 text-xs text-slate-500">{label}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-amber-600">* 附件上传为轻量实现，暂无真实存储功能</p>
          </div>
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
            {loading ? '处理中...' : '确认出库'}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
