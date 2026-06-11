import { Check, ChevronRight, ArrowRight, MessageSquare } from 'lucide-react';
import type { Promotion } from '@/types';
import { ROLE_LABELS, STATUS_LABELS } from '@/types';

interface ProcessStepperProps {
  promotion: Promotion;
}

const steps = [
  { key: 'create', role: 'counterManager' as const, label: '柜长创建', desc: '填写活动信息' },
  { key: 'supervisor', role: 'floorSupervisor' as const, label: '主管审核', desc: '楼层审批意见' },
  { key: 'brand', role: 'brandSupervisor' as const, label: '督导确认', desc: '品牌方终审' },
  { key: 'active', role: 'brandSupervisor' as const, label: '活动执行', desc: '活动落地执行' },
  { key: 'sales', role: 'brandSupervisor' as const, label: '销售核对', desc: '录入数据归档' },
];

const statusStepMap: Record<string, number> = {
  draft: 0,
  pendingSupervisor: 1,
  pendingBrand: 2,
  active: 3,
  salesPending: 4,
  completed: 5,
  rejected: -1,
};

export function ProcessStepper({ promotion }: ProcessStepperProps) {
  const currentStepIndex = statusStepMap[promotion.status] ?? 0;
  const isRejected = promotion.status === 'rejected';
  const isCompleted = promotion.status === 'completed';

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-slate-700">接力处理流程</h4>
          <span className="text-[10px] text-slate-400">
            柜长 → 主管 → 督导 · 备注全程延续
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge role-badge-${promotion.currentRole}`}>
            当前：{ROLE_LABELS[promotion.currentRole]}
          </span>
          <span className={`badge status-badge-${promotion.status}`}>
            {STATUS_LABELS[promotion.status]}
          </span>
        </div>
      </div>

      <div className="flex items-start justify-between relative">
        {steps.map((step, index) => {
          const stepCompleted = currentStepIndex > index || isCompleted;
          const stepCurrent = currentStepIndex === index && !isCompleted;
          const stepRejected = isRejected && index < currentStepIndex;

          return (
            <div key={step.key} className="flex-1 flex flex-col items-center relative z-10">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  stepCompleted && !stepRejected
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : stepCurrent
                    ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/30'
                    : stepRejected
                    ? 'bg-red-500 border-red-500 text-white'
                    : 'bg-white border-slate-300 text-slate-400'
                }`}
              >
                {stepCompleted && !stepRejected ? (
                  <Check size={18} />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <div className="mt-2 text-center">
                <p className={`text-xs font-semibold ${
                  stepCurrent ? 'text-amber-600' : stepCompleted ? 'text-slate-700' : 'text-slate-400'
                }`}>
                  {step.label}
                </p>
                <p className={`text-[10px] mt-0.5 ${
                  stepCurrent ? 'text-amber-500' : 'text-slate-400'
                }`}>
                  {ROLE_LABELS[step.role]}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 max-w-[100px] mx-auto">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
        <div className="absolute top-5 left-0 right-0 h-0.5 -z-0">
          <div className="flex h-full">
            {[0, 1, 2, 3].map((i) => {
              const lineDone = currentStepIndex > i || isCompleted;
              return (
                <div 
                  key={i}
                  className={`flex-1 mx-4 transition-all duration-500 ${
                    lineDone ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                />
              );
            })}
          </div>
        </div>
      </div>
      
      {isRejected && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
          <MessageSquare size={16} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700">已驳回</p>
            <p className="text-xs text-red-600 mt-0.5">
              请查看下方处理记录了解驳回原因，根据意见修改后重新提交。历史备注已保留。
            </p>
          </div>
        </div>
      )}

      {isCompleted && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-md flex items-start gap-2">
          <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-emerald-700">流程已完成</p>
            <p className="text-xs text-emerald-600 mt-0.5">
              所有环节已处理完毕，可在销售核对中查看完整归档记录。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
