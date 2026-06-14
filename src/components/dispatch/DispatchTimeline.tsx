import { useMemo } from 'react';
import type { Case } from '@/types';
import { useDispatchStore } from '@/stores/dispatchStore';
import { DISPATCH_STEPS, ROLE_META } from '@/data/constants';
import { CheckCircle2, Circle, Bell, Signature, Archive, Eye, GitPullRequest, User, ShieldCheck } from 'lucide-react';
import { formatDateTime } from '@/utils/timeUtils';
import RoleAvatar from '@/components/common/RoleAvatar';

const STEP_ICONS = {
  'check-circle-2': ShieldCheck,
  bell: Bell,
  signature: Signature,
  archive: Archive,
} as const;

interface Props {
  caseData: Case;
}

export default function DispatchTimeline({ caseData }: Props) {
  const dispatch = caseData.dispatch;
  const replayMode = useDispatchStore((s) => s.replayMode);
  const replayStepIndex = useDispatchStore((s) => s.replayStepIndex);
  const setReplayStepIndex = useDispatchStore((s) => s.setReplayStepIndex);

  const steps = useMemo(() => {
    const hasPassed =
      caseData.reviews.some((r) => r.status === 'completed' && r.rejectedItems.length === 0) ||
      ['dispatch_notice', 'dispatch_sign', 'archived'].includes(caseData.currentStage);
    const lastReview = [...caseData.reviews].reverse().find(
      (r) => r.status === 'completed' && r.rejectedItems.length === 0,
    );

    return [
      {
        key: 'review_pass',
        label: '审核通过',
        icon: STEP_ICONS['check-circle-2'],
        done: hasPassed,
        time: lastReview?.createdAt,
        operator: lastReview?.reviewer,
        role: 'quality_controller' as const,
        desc: lastReview
          ? `${lastReview.checkedItems.length}项审核通过，意见书准予发放`
          : '意见书质控审核全票通过，准予发放',
      },
      {
        key: 'notice',
        label: '通知领取',
        icon: STEP_ICONS.bell,
        done: !!dispatch?.noticeDate,
        time: dispatch?.noticeDate,
        operator: '王发放',
        role: 'receptionist' as const,
        desc: dispatch?.noticeDate
          ? `已通知${caseData.entrustParty}领取`
          : `联系${caseData.entrustParty}领取意见书`,
      },
      {
        key: 'sign',
        label: '签收确认',
        icon: STEP_ICONS.signature,
        done: !!dispatch?.receiverIdCard,
        time: dispatch?.pickupDate,
        operator: dispatch?.receiver || '签收人',
        role: 'receptionist' as const,
        desc: dispatch?.receiverIdCard
          ? `签收人：${dispatch.receiver}（${dispatch.receiverIdCard}）`
          : '核验领取人身份并登记签收',
      },
      {
        key: 'archive',
        label: '归档完成',
        icon: STEP_ICONS.archive,
        done: caseData.currentStage === 'archived',
        time: dispatch?.archiveDate,
        operator: '档案室',
        role: 'receptionist' as const,
        desc:
          caseData.currentStage === 'archived'
            ? '案卷已归档，发放流程结束'
            : '案卷归档，完成结案',
      },
    ];
  }, [caseData, dispatch]);

  const effectiveIndex = replayMode ? replayStepIndex : steps.findIndex((s) => !s.done);
  const displayUpTo = effectiveIndex === -1 ? steps.length : effectiveIndex;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 bg-white/70 px-4 py-2">
        <div className="text-[11.5px] font-semibold text-slate-700">
          发放时间线
          {replayMode && (
            <span className="ml-2 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 animate-pulse">
              <Eye className="mr-0.5 inline h-2.5 w-2.5" />
              回看模式 · 步骤 {displayUpTo}/{steps.length}
            </span>
          )}
        </div>
        <div className="text-[10.5px] text-slate-500">
          {replayMode ? '点击节点可切换快照' : '点击节点查看当时详情'}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="relative">
          <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-slate-200">
            <div
              className="absolute inset-x-0 top-0 bg-emerald-500 transition-all duration-500"
              style={{
                height: replayMode
                  ? `${(displayUpTo / steps.length) * 100}%`
                  : `${(steps.filter((s) => s.done).length / steps.length) * 100}%`,
              }}
            />
          </div>

          <div className="space-y-4">
            {steps.map((step, idx) => {
              const isDone = replayMode ? idx < displayUpTo : step.done;
              const isCurrent = replayMode ? idx === displayUpTo - 1 : idx === effectiveIndex - 1;
              const isFuture = replayMode ? idx >= displayUpTo : !isDone && !isCurrent;
              const Icon = step.icon;
              const canClick = replayMode || isDone;

              return (
                <div
                  key={step.key}
                  onClick={() => canClick && replayMode && setReplayStepIndex(idx + 1)}
                  className={`relative flex gap-3 pl-1 ${
                    canClick && replayMode ? 'cursor-pointer' : ''
                  }`}
                >
                  <div
                    className={`relative z-10 mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 ring-white transition-all ${
                      isDone
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                        : isCurrent
                          ? 'bg-amber-500 text-white shadow-md shadow-amber-200 animate-pulse'
                          : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Icon className="h-4.5 w-4.5" />
                    )}
                  </div>

                  <div
                    className={`flex-1 min-w-0 rounded-lg border p-3 transition-all ${
                      isCurrent
                        ? 'border-amber-300 bg-amber-50/70 shadow-sm shadow-amber-100'
                        : isDone
                          ? 'border-slate-200 bg-slate-50/60 hover:bg-slate-50'
                          : 'border-dashed border-slate-200 bg-slate-50/30 opacity-70'
                    } ${isFuture ? 'animate-dash-pulse' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div
                          className={`text-[13px] font-semibold ${
                            isCurrent
                              ? 'text-amber-800'
                              : isDone
                                ? 'text-slate-800'
                                : 'text-slate-500'
                          }`}
                        >
                          {idx + 1}. {step.label}
                        </div>
                        <div className="mt-0.5 text-[11.5px] text-slate-600 leading-relaxed">
                          {step.desc}
                        </div>
                      </div>
                      {step.time && (
                        <div className="shrink-0 text-right">
                          <div className="font-mono text-[10.5px] text-slate-500">
                            {formatDateTime(step.time)}
                          </div>
                          {step.operator && (
                            <div className="mt-1 flex items-center justify-end gap-1">
                              <RoleAvatar
                                name={step.operator}
                                role={step.role}
                                size="sm"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {isCurrent && !replayMode && (
                      <div className="mt-2 rounded bg-white/80 px-2 py-1 text-[10.5px] text-amber-700 ring-1 ring-amber-200">
                        <span className="font-semibold">当前步骤：</span>
                        {step.key === 'notice' && '请在右侧操作区点击「发送领取通知」'}
                        {step.key === 'sign' && '请在右侧操作区填写签收人信息并确认'}
                        {step.key === 'archive' && '签收确认后可点击「归档」完成结案'}
                        {step.key === 'review_pass' && caseData.currentStage === 'quality_review' && '请完成意见书审核（全部通过）'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-600">
            <User className="h-3.5 w-3.5" />
            委托方信息
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-500">委托方：</span>
              <span className="font-medium text-slate-700">{caseData.entrustParty}</span>
            </div>
            <div>
              <span className="text-slate-500">受理日期：</span>
              <span className="font-mono text-slate-700">{formatDateTime(caseData.entrustDate)}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500">意见书版本：</span>
              <span className="font-medium text-slate-700">
                共 {caseData.opinions.length} 版，
                最新 V{caseData.opinions[caseData.opinions.length - 1]?.version || 0}
                {' · '}
                起草人 {caseData.opinions[caseData.opinions.length - 1]?.draftBy || '-'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
