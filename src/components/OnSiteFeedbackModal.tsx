import { useState } from 'react';
import {
  X,
  MapPin,
  Send,
  RotateCcw,
  CheckCircle,
  FileText,
  User,
  Clock,
  Lamp,
  AlertCircle,
} from 'lucide-react';
import { useWorkOrderStore } from '../store/workOrderStore';
import { useAuthStore } from '../store/authStore';

export function OnSiteFeedbackModal() {
  const {
    selectedWorkOrder,
    isOnSiteModalOpen,
    closeOnSiteModal,
    submitOnSiteFeedback,
  } = useWorkOrderStore();
  const { currentUser } = useAuthStore();

  const [onSiteRemark, setOnSiteRemark] = useState('');
  const [result, setResult] = useState<'complete' | 'return'>('complete');
  const [returnReason, setReturnReason] = useState('');
  const [errors, setErrors] = useState<{ remark?: string; returnReason?: string }>({});

  if (!selectedWorkOrder || !isOnSiteModalOpen) return null;

  const validate = () => {
    const newErrors: { remark?: string; returnReason?: string } = {};
    if (!onSiteRemark.trim()) {
      newErrors.remark = '请填写到场反馈';
    }
    if (result === 'return' && !returnReason.trim()) {
      newErrors.returnReason = '请填写退回原因';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    submitOnSiteFeedback(
      selectedWorkOrder.id,
      onSiteRemark,
      result,
      result === 'return' ? returnReason : undefined
    );

    setOnSiteRemark('');
    setResult('complete');
    setReturnReason('');
    setErrors({});
    closeOnSiteModal();
  };

  const handleClose = () => {
    setOnSiteRemark('');
    setResult('complete');
    setReturnReason('');
    setErrors({});
    closeOnSiteModal();
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={handleClose}
      />
      <div className="fixed right-0 top-0 h-full w-[540px] bg-white shadow-sidebar z-50 animate-slide-in-right flex flex-col">
        <header className="border-b border-neutral-200 p-5 flex items-start justify-between flex-shrink-0 bg-gradient-to-r from-warning-50 to-white">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-5 h-5 text-warning-500" />
              <h2 className="text-lg font-bold text-neutral-800">到场反馈</h2>
            </div>
            <p className="text-sm text-neutral-500 font-mono-cn">
              {selectedWorkOrder.orderNo}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-white/80 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5">
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              当前操作人
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-base">
                {currentUser?.name?.charAt(0) || '用'}
              </div>
              <div>
                <p className="text-base font-medium text-neutral-800">
                  {currentUser?.name}
                </p>
                <p className="text-xs text-neutral-500">
                  {currentUser?.employeeNo} · 电工
                </p>
              </div>
            </div>
          </div>

          {selectedWorkOrder.dispatchRemark && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-primary-700 px-2 py-0.5 bg-primary-100 rounded">
                      派工备注
                    </span>
                    <span className="text-xs text-primary-500">
                      调度员 · {selectedWorkOrder.dispatchTime}
                    </span>
                  </div>
                  <p className="text-sm text-primary-800 leading-relaxed">
                    {selectedWorkOrder.dispatchRemark}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="card p-4">
            <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
              <Lamp className="w-4 h-4" />
              工单信息
            </h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">灯杆位置</span>
                <span className="text-neutral-800 font-medium">
                  {selectedWorkOrder.lampPost.location}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">故障类型</span>
                <span className="text-neutral-800 font-medium">
                  {selectedWorkOrder.faultType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">灯杆型号</span>
                <span className="text-neutral-800">
                  {selectedWorkOrder.lampPost.model}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">派工时间</span>
                <span className="text-neutral-800 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {selectedWorkOrder.dispatchTime}
                </span>
              </div>
              <div className="pt-2 border-t border-neutral-100">
                <span className="text-neutral-500 text-sm mb-2 block">故障描述</span>
                <p className="text-sm text-neutral-700 bg-neutral-50 p-3 rounded leading-relaxed">
                  {selectedWorkOrder.patrolRecord.description}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              到场反馈 <span className="text-danger-500">*</span>
            </label>
            <textarea
              value={onSiteRemark}
              onChange={(e) => setOnSiteRemark(e.target.value)}
              placeholder="请详细描述：
1. 现场检查情况
2. 故障原因分析
3. 已采取的处理措施
4. 需要协调的事项"
              className={`textarea h-36 ${errors.remark ? 'border-danger-500' : ''}`}
            />
            {errors.remark && (
              <p className="text-xs text-danger-500 mt-1">{errors.remark}</p>
            )}
            <div className="mt-2 flex items-start gap-1.5">
              <AlertCircle className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-neutral-400 leading-relaxed">
                到场反馈将永久保存，作为维修记录和后续追溯依据。请务必详细、准确填写。
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              处理结果
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                  result === 'complete'
                    ? 'border-success-500 bg-success-50 ring-1 ring-success-200'
                    : 'border-neutral-200 hover:border-success-300 hover:bg-neutral-50'
                }`}
              >
                <input
                  type="radio"
                  name="result"
                  value="complete"
                  checked={result === 'complete'}
                  onChange={() => setResult('complete')}
                  className="w-4 h-4 text-success-600 focus:ring-success-500"
                />
                <div className="ml-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success-500" />
                    <span className="text-sm font-medium text-neutral-800">继续处理</span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    到场后继续维修，工单状态更新为处理中
                  </p>
                </div>
              </label>
              <label
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                  result === 'return'
                    ? 'border-danger-500 bg-danger-50 ring-1 ring-danger-200'
                    : 'border-neutral-200 hover:border-danger-300 hover:bg-neutral-50'
                }`}
              >
                <input
                  type="radio"
                  name="result"
                  value="return"
                  checked={result === 'return'}
                  onChange={() => setResult('return')}
                  className="w-4 h-4 text-danger-600 focus:ring-danger-500"
                />
                <div className="ml-3">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-danger-500" />
                    <span className="text-sm font-medium text-neutral-800">申请退回</span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    需要其他资源或协调，退回调度员处理
                  </p>
                </div>
              </label>
            </div>
          </div>

          {result === 'return' && (
            <div className="animate-fade-in">
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                退回原因 <span className="text-danger-500">*</span>
              </label>
              <textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="请详细说明退回原因：
1. 遇到的具体困难
2. 需要什么支持（设备/人员/材料）
3. 预计可重新处理的时间"
                className={`textarea h-28 ${errors.returnReason ? 'border-danger-500' : ''}`}
              />
              {errors.returnReason && (
                <p className="text-xs text-danger-500 mt-1">{errors.returnReason}</p>
              )}
              <div className="mt-2 bg-warning-50 border border-warning-200 rounded-lg p-3">
                <p className="text-xs text-warning-700 flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    退回后工单将返回调度员待办列表，调度员会根据情况协调资源后二次派工。
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        <footer className="border-t border-neutral-200 p-4 bg-neutral-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={handleClose} className="btn-secondary flex-1 py-2.5">
              取消
            </button>
            <button
              onClick={handleSubmit}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 btn ${
                result === 'complete'
                  ? 'bg-success-500 text-white hover:bg-success-600'
                  : 'bg-danger-500 text-white hover:bg-danger-600'
              }`}
            >
              {result === 'complete' ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  确认到场
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  申请退回
                </>
              )}
            </button>
          </div>
        </footer>
      </div>
    </>
  );
}
