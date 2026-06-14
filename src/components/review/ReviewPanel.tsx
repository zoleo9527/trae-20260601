import { useEffect, useMemo } from 'react';
import { useCaseStore } from '@/stores/caseStore';
import { useReviewStore } from '@/stores/reviewStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { REVIEW_CHECKLIST, CHECKLIST_CATEGORY_META, SEVERITY_META } from '@/data/reviewChecklist';
import OpinionContentView from '@/components/review/OpinionContentView';
import ChecklistSidebar from '@/components/review/ChecklistSidebar';
import RejectDrawer from '@/components/review/RejectDrawer';
import SampleExceptionButton from '@/components/review/SampleExceptionButton';
import StatusBadge from '@/components/case/StatusBadge';
import RoleAvatar from '@/components/common/RoleAvatar';
import { REVIEW_CHECKLIST as RC } from '@/data/reviewChecklist';
import { Scale, Send, XCircle, CheckCircle2, ArrowDownToLine } from 'lucide-react';
import { uid } from '@/utils/timeUtils';

export default function ReviewPanel({ caseId }: { caseId: string }) {
  const cases = useCaseStore((s) => s.cases);
  const caseData = useMemo(() => cases.find((c) => c.id === caseId), [cases, caseId]);
  const setActiveCase = useReviewStore((s) => s.setActiveCase);
  const reviewMode = useReviewStore((s) => s.reviewMode);
  const checkedItems = useReviewStore((s) => s.checkedItems);
  const rejectedItems = useReviewStore((s) => s.rejectedItems);
  const startReview = useReviewStore((s) => s.startReview);
  const submitPass = useReviewStore((s) => s.submitPass);
  const openRejectDialog = useReviewStore((s) => s.openRejectDialog);
  const reset = useReviewStore((s) => s.reset);

  useEffect(() => {
    setActiveCase(caseId);
    return () => {
      setActiveCase(null);
      reset();
    };
  }, [caseId, setActiveCase, reset]);

  if (!caseData) return null;
  const latestOpinion = caseData.opinions[caseData.opinions.length - 1];
  const latestReview = caseData.reviews[caseData.reviews.length - 1];
  const total = RC.length;
  const progress = checkedItems.length + rejectedItems.length;
  const canReview = caseData.currentStage === 'quality_review' || reviewMode !== 'none';

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-100 text-amber-700 ring-1 ring-amber-200">
            <Scale className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800">意见书审核处理</div>
            <div className="text-[11px] text-slate-500">
              {latestOpinion ? (
                <>
                  V{latestOpinion.version} · 起草人 {latestOpinion.draftBy} ·{' '}
                  {new Date(latestOpinion.submitDate).toLocaleString('zh-CN', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </>
              ) : (
                '意见书尚未提交'
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {reviewMode === 'none' && canReview && latestOpinion && (
            <button
              onClick={startReview}
              className="flex items-center gap-1.5 rounded-md bg-[#1e3a5f] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[#2a4d78]"
            >
              <ArrowDownToLine className="h-3.5 w-3.5" />
              开始逐条审核
            </button>
          )}
          <SampleExceptionButton caseId={caseId} />
          {reviewMode === 'reviewing' && (
            <>
              <div className="flex items-center gap-2 rounded-md bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${(progress / total) * 100}%` }}
                  />
                </div>
                <span className="font-mono tabular-nums">
                  {progress}/{total}
                </span>
              </div>
              <button
                onClick={() => {
                  if (rejectedItems.length > 0) openRejectDialog();
                  else {
                    useNotificationStore.getState().pushToast({
                      id: uid('t'),
                      type: 'info',
                      title: '请先勾选问题条目',
                      message: '需要标记驳回的审核项后再使用驳回功能',
                    });
                  }
                }}
                disabled={rejectedItems.length === 0}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  rejectedItems.length === 0
                    ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                    : 'border-l-[3px] border-rose-600 bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                <XCircle className="h-3.5 w-3.5" />
                驳回（{rejectedItems.length}）
              </button>
              <button
                onClick={submitPass}
                disabled={checkedItems.length < total}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  checkedItems.length < total
                    ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                全部通过
                <span className="font-mono">({checkedItems.length}/{total})</span>
              </button>
            </>
          )}
          {reviewMode === 'none' && latestReview && latestReview.status === 'completed' && (
            <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] text-emerald-700 ring-1 ring-emerald-200">
              {latestReview.rejectedItems.length > 0 ? (
                <>
                  <XCircle className="h-3.5 w-3.5" />
                  上轮审核：已驳回 {latestReview.rejectedItems.length} 项
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  上次审核已通过（{latestReview.checkedItems.length}项）
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-[55%] border-r border-slate-200">
          {latestOpinion ? (
            <OpinionContentView
              opinion={latestOpinion}
              rejectedItems={reviewMode === 'reviewing' ? rejectedItems : latestReview?.rejectedItems || []}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">
              <div className="text-center">
                <Send className="mx-auto mb-2 h-10 w-10 opacity-40" />
                <div className="text-sm">意见书尚未提交审核</div>
              </div>
            </div>
          )}
        </div>
        <div className="w-[45%]">
          <ChecklistSidebar reviewMode={reviewMode} caseSamples={caseData.samples} />
        </div>
      </div>

      <RejectDrawer caseId={caseId} />
    </div>
  );
}
