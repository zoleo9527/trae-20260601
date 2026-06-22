import { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  FileText,
  User,
  Clock,
  Lamp,
  AlertCircle,
  Send,
} from 'lucide-react';
import { useWorkOrderStore } from '../store/workOrderStore';
import { useAuthStore } from '../store/authStore';

export function CompleteModal() {
  const {
    selectedWorkOrder,
    isCompleteModalOpen,
    closeCompleteModal,
    completeWorkOrder,
  } = useWorkOrderStore();
  const { currentUser } = useAuthStore();

  const [completeRemark, setCompleteRemark] = useState('');
  const [errors, setErrors] = useState<{ remark?: string }>({});

  useEffect(() => {
    if (selectedWorkOrder && isCompleteModalOpen) {
      setCompleteRemark(selectedWorkOrder.completeRemark || '');
      setErrors({});
    }
  }, [selectedWorkOrder, isCompleteModalOpen]);

  if (!selectedWorkOrder || !isCompleteModalOpen) return null;

  const validate = () => {
    const newErrors: { remark?: string } = {};
    if (!completeRemark.trim()) {
      newErrors.remark = '请填写完成备注';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    completeWorkOrder(selectedWorkOrder.id, completeRemark);

    setCompleteRemark('');
    setErrors({});
    closeCompleteModal();
  };

  const handleClose = () => {
    setCompleteRemark('');
    setErrors({});
    closeCompleteModal();
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={handleClose}
      />
      <div className="fixed right-0 top-0 h-full w-[520px] bg-white shadow-sidebar z-50 animate-slide-in-right flex flex-col">
        <header className="border-b border-neutral-200 p-5 flex items-start justify-between flex-shrink-0 bg-gradient-to-r from-success-50 to-white">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-5 h-5 text-success-500" />
              <h2 className="text-lg font-bold text-neutral-800">完成维修</h2>
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
              <div className="w-12 h-12 rounded-full bg-success-500 flex items-center justify-center text-white font-semibold text-base">
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
              {selectedWorkOrder.onSiteTime && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">到场时间</span>
                  <span className="text-neutral-800 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {selectedWorkOrder.onSiteTime}
                  </span>
                </div>
              )}
            </div>
          </div>

          {selectedWorkOrder.onSiteRemark && (
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-warning-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-warning-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-warning-700 px-2 py-0.5 bg-warning-100 rounded">
                      到场反馈
                    </span>
                    {selectedWorkOrder.onSiteTime && (
                      <span className="text-xs text-warning-500">
                        {selectedWorkOrder.onSiteTime}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-warning-800 leading-relaxed">
                    {selectedWorkOrder.onSiteRemark}
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedWorkOrder.dispatchRemark && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <Send className="w-4 h-4 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-primary-700 px-2 py-0.5 bg-primary-100 rounded">
                      派工备注
                    </span>
                    {selectedWorkOrder.dispatchTime && (
                      <span className="text-xs text-primary-500">
                        {selectedWorkOrder.dispatchTime}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-primary-800 leading-relaxed">
                    {selectedWorkOrder.dispatchRemark}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              完成备注 <span className="text-danger-500">*</span>
            </label>
            <textarea
              value={completeRemark}
              onChange={(e) => setCompleteRemark(e.target.value)}
              placeholder="请详细描述：
1. 故障原因确认
2. 维修处理过程
3. 更换的零部件
4. 测试验证结果
5. 后续注意事项"
              className={`textarea h-40 ${errors.remark ? 'border-danger-500' : ''}`}
            />
            {errors.remark && (
              <p className="text-xs text-danger-500 mt-1">{errors.remark}</p>
            )}
            <div className="mt-2 flex items-start gap-1.5">
              <AlertCircle className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-neutral-400 leading-relaxed">
                完成备注将作为最终维修记录永久保存，是后续灯杆维护和故障追溯的重要依据。请务必详细、准确填写。
              </p>
            </div>
          </div>
        </div>

        <footer className="border-t border-neutral-200 p-4 bg-neutral-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={handleClose} className="btn-secondary flex-1 py-2.5">
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 btn bg-success-500 text-white hover:bg-success-600"
            >
              <CheckCircle className="w-4 h-4" />
              确认完成
            </button>
          </div>
        </footer>
      </div>
    </>
  );
}
