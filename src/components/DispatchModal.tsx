import { useState, useEffect } from 'react';
import { X, Send, User, AlertTriangle, Clock, FileText, History } from 'lucide-react';
import { useWorkOrderStore } from '../store/workOrderStore';
import { mockUsers } from '../data/mockData';
import type { Priority } from '../types';
import { priorityLabels, roleLabels } from '../types';

export function DispatchModal() {
  const {
    selectedWorkOrder,
    isDispatchModalOpen,
    closeDispatchModal,
    dispatchWorkOrder,
  } = useWorkOrderStore();

  const [selectedElectrician, setSelectedElectrician] = useState('');
  const [priority, setPriority] = useState<Priority>('high');
  const [remark, setRemark] = useState('');
  const [errors, setErrors] = useState<{ electrician?: string; remark?: string }>({});

  useEffect(() => {
    if (selectedWorkOrder && isDispatchModalOpen) {
      if (selectedWorkOrder.status === 'returned' && selectedWorkOrder.electricianId) {
        setSelectedElectrician(selectedWorkOrder.electricianId);
      } else {
        setSelectedElectrician('');
      }
      setPriority(selectedWorkOrder.priority);
      setRemark(selectedWorkOrder.dispatchRemark || '');
      setErrors({});
    }
  }, [selectedWorkOrder, isDispatchModalOpen]);

  if (!selectedWorkOrder || !isDispatchModalOpen) return null;

  const electricians = mockUsers.filter((u) => u.role === 'electrician');

  const isReturned = selectedWorkOrder.status === 'returned';

  const validate = () => {
    const newErrors: { electrician?: string; remark?: string } = {};
    if (!selectedElectrician) {
      newErrors.electrician = '请选择维修电工';
    }
    if (!remark.trim()) {
      newErrors.remark = '请填写派工备注';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const electrician = electricians.find((e) => e.id === selectedElectrician);
    if (!electrician || !selectedWorkOrder) return;

    dispatchWorkOrder(
      selectedWorkOrder.id,
      electrician.id,
      electrician.name,
      remark,
      priority
    );

    setSelectedElectrician('');
    setPriority('high');
    setRemark('');
    setErrors({});
    closeDispatchModal();
  };

  const handleClose = () => {
    setSelectedElectrician('');
    setPriority('high');
    setRemark('');
    setErrors({});
    closeDispatchModal();
  };

  const previousRemarks = selectedWorkOrder.remarks.filter(
    (r) => r.type === 'dispatch' || r.type === 'return'
  );

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={handleClose}
      />
      <div className="fixed right-0 top-0 h-full w-[520px] bg-white shadow-sidebar z-50 animate-slide-in-right flex flex-col">
        <header
          className={`border-b p-5 flex items-start justify-between flex-shrink-0 ${
            isReturned
              ? 'bg-gradient-to-r from-danger-50 to-white border-danger-200'
              : 'bg-gradient-to-r from-primary-50 to-white border-neutral-200'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isReturned && <AlertTriangle className="w-5 h-5 text-danger-500" />}
              <h2 className="text-lg font-bold text-neutral-800">
                {isReturned ? '二次派工' : '维修派工'}
              </h2>
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
          {isReturned && selectedWorkOrder.returnReason && (
            <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-danger-700 mb-1">退回原因</p>
                  <p className="text-sm text-danger-600 leading-relaxed">
                    {selectedWorkOrder.returnReason}
                  </p>
                  <p className="text-xs text-danger-500 mt-2">
                    退回时间：{selectedWorkOrder.returnTime}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="card p-4">
            <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
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
                <span className="text-neutral-500">优先级</span>
                <span className="text-neutral-800 font-medium">
                  {priorityLabels[selectedWorkOrder.priority]}
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

          {previousRemarks.length > 0 && (
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                <History className="w-4 h-4" />
                历史记录
              </h3>
              <div className="space-y-3">
                {previousRemarks.map((r) => (
                  <div
                    key={r.id}
                    className={`p-3 rounded-lg text-sm ${
                      r.type === 'dispatch'
                        ? 'bg-primary-50 border border-primary-100'
                        : 'bg-danger-50 border border-danger-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-neutral-600">
                        {r.authorName} ({roleLabels[r.authorRole]})
                      </span>
                      <span className="text-xs text-neutral-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {r.timestamp}
                      </span>
                    </div>
                    <p className="text-neutral-700 text-sm leading-relaxed">{r.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              维修电工 <span className="text-danger-500">*</span>
            </label>
            <div className="space-y-2">
              {electricians.map((electrician) => {
                const isSelected = selectedElectrician === electrician.id;
                const isPrevious =
                  isReturned && selectedWorkOrder.electricianId === electrician.id;

                return (
                  <label
                    key={electrician.id}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-200'
                        : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50'
                    } ${errors.electrician ? 'border-danger-500' : ''}`}
                  >
                    <input
                      type="radio"
                      name="electrician"
                      value={electrician.id}
                      checked={isSelected}
                      onChange={(e) => setSelectedElectrician(e.target.value)}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-neutral-800">
                              {electrician.name}
                            </span>
                            <span className="text-xs text-neutral-400">
                              {electrician.employeeNo}
                            </span>
                            {isPrevious && (
                              <span className="text-xs bg-warning-100 text-warning-700 px-1.5 py-0.5 rounded">
                                上次处理
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-xs text-neutral-500">
                              当前负载：{electrician.workload} 个工单
                            </span>
                            {electrician.workload === 0 && (
                              <span className="text-xs text-success-600 bg-success-50 px-1.5 py-0.5 rounded font-medium">
                                空闲
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            {errors.electrician && (
              <p className="text-xs text-danger-500 mt-1">{errors.electrician}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              优先级
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(priorityLabels) as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
                    priority === p
                      ? p === 'urgent'
                        ? 'bg-danger-50 border-danger-500 text-danger-700 ring-1 ring-danger-200'
                        : p === 'high'
                        ? 'bg-warning-50 border-warning-500 text-warning-700 ring-1 ring-warning-200'
                        : p === 'medium'
                        ? 'bg-primary-50 border-primary-500 text-primary-700 ring-1 ring-primary-200'
                        : 'bg-neutral-50 border-neutral-500 text-neutral-700 ring-1 ring-neutral-200'
                      : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
                  }`}
                >
                  {priorityLabels[p]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              派工备注 <span className="text-danger-500">*</span>
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="请输入派工备注，说明维修重点、注意事项、所需工具等..."
              className={`textarea h-32 ${errors.remark ? 'border-danger-500' : ''}`}
            />
            {errors.remark && (
              <p className="text-xs text-danger-500 mt-1">{errors.remark}</p>
            )}
            <div className="mt-2 flex items-start gap-1.5">
              <div className="w-4 h-4 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary-600 text-xs font-bold">i</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                派工备注将自动带入到场反馈页面，电工可以看到并继续补充。
                {isReturned && ' 请针对退回原因说明处理方案。'}
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
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 btn ${
                isReturned
                  ? 'bg-warning-500 text-white hover:bg-warning-600'
                  : 'bg-primary-700 text-white hover:bg-primary-800'
              }`}
            >
              <Send className="w-4 h-4" />
              {isReturned ? '确认二次派工' : '确认派工'}
            </button>
          </div>
        </footer>
      </div>
    </>
  );
}
