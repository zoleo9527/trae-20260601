import { useState } from 'react';
import { Package, AlertCircle, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { Drawer } from './Drawer';
import { api } from '../utils/api';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';
import type { PrescriptionDetail, SignResult } from '../../shared/types';
import { formatDateTime } from '../utils/format';

interface SignReviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  prescription: PrescriptionDetail;
  onSuccess: () => void;
}

const returnTypes = ['拒收', '地址错误', '电话无人接听', '收件人不在', '其他'];

export function SignReviewDrawer({ isOpen, onClose, prescription, onSuccess }: SignReviewDrawerProps) {
  const [signResult, setSignResult] = useState<SignResult | ''>('');
  const [returnType, setReturnType] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [supplementaryRemark, setSupplementaryRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const operatorName = useAppStore((state) => state.operatorName);
  const deliveryInfo = prescription.deliveryInfo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!signResult) {
      setError('请选择签收结果');
      return;
    }
    if (signResult === 'RETURNED' && !returnType) {
      setError('请选择退回类型');
      return;
    }
    if (signResult === 'RETURNED' && !returnReason.trim()) {
      setError('请输入退回原因');
      return;
    }
    if (!operatorName.trim()) {
      setError('请先在右上角设置操作员姓名');
      return;
    }

    setLoading(true);
    try {
      await api.signPrescription(prescription.id, {
        operatorName,
        signResult: signResult as SignResult,
        returnType: signResult === 'RETURNED' ? returnType : undefined,
        returnReason: signResult === 'RETURNED' ? returnReason.trim() : undefined,
        supplementaryRemark: supplementaryRemark.trim() || undefined,
      });
      onSuccess();
      onClose();
      setSignResult('');
      setReturnType('');
      setReturnReason('');
      setSupplementaryRemark('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="签收回查">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
          <div className="flex items-center gap-2 text-teal-700">
            <Package className="w-4 h-4" />
            <span className="text-sm font-medium">配送信息</span>
          </div>
          <div className="mt-2 space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-slate-500">处方编号</div>
              <div className="font-medium text-slate-900">{prescription.prescriptionNo}</div>
              <div className="text-slate-500">患者姓名</div>
              <div className="font-medium text-slate-900">{prescription.patientName}</div>
              <div className="text-slate-500">快递公司</div>
              <div className="font-medium text-slate-900">{deliveryInfo?.courierCompany || '-'}</div>
              <div className="text-slate-500">快递单号</div>
              <div className="font-medium text-slate-900 font-mono">{deliveryInfo?.trackingNo || '-'}</div>
              <div className="text-slate-500">出库时间</div>
              <div className="font-medium text-slate-900">{deliveryInfo ? formatDateTime(deliveryInfo.createdAt) : '-'}</div>
            </div>
            {deliveryInfo?.deliveryRemark && (
              <div className="pt-2 border-t border-teal-200">
                <div className="text-slate-500 mb-1">配送出库备注</div>
                <div className="p-2 bg-white rounded border border-teal-200 text-slate-700">
                  {deliveryInfo.deliveryRemark}
                </div>
              </div>
            )}
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
            <label className="block text-sm font-medium text-slate-700 mb-3">
              签收结果 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSignResult('NORMAL')}
                className={cn(
                  'flex items-center justify-center gap-2 p-4 border-2 rounded-lg transition-all',
                  signResult === 'NORMAL'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-slate-200 hover:border-green-300 text-slate-600'
                )}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">正常签收</span>
              </button>
              <button
                type="button"
                onClick={() => setSignResult('RETURNED')}
                className={cn(
                  'flex items-center justify-center gap-2 p-4 border-2 rounded-lg transition-all',
                  signResult === 'RETURNED'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-slate-200 hover:border-red-300 text-slate-600'
                )}
              >
                <XCircle className="w-5 h-5" />
                <span className="font-medium">退回</span>
              </button>
            </div>
          </div>

          {signResult === 'RETURNED' && (
            <div className="space-y-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  退回类型 <span className="text-red-500">*</span>
                </label>
                <select
                  value={returnType}
                  onChange={(e) => setReturnType(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white"
                >
                  <option value="">请选择退回类型</option>
                  {returnTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  退回原因 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="请详细描述退回原因"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              补充备注
            </label>
            <textarea
              value={supplementaryRemark}
              onChange={(e) => setSupplementaryRemark(e.target.value)}
              placeholder={signResult === 'NORMAL' ? '签收人、是否有异常情况等' : '后续处理建议、与患者沟通情况等'}
              rows={2}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors resize-none"
            />
            <p className="mt-1 text-xs text-slate-400">
              补充备注将与配送出库备注一起保存在同一条记录中
            </p>
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
                : signResult === 'RETURNED'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-teal-600 text-white hover:bg-teal-700'
            )}
          >
            {loading ? '处理中...' : '确认提交'}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
