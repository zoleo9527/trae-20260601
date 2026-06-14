import type { Case, CorrectionTask } from '@/types';
import { ROLE_META } from '@/data/constants';
import { useCaseStore } from '@/stores/caseStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { ClipboardCheck, Clock, AlertCircle, CheckCircle2, Send } from 'lucide-react';
import { formatDate, isOverdue, uid } from '@/utils/timeUtils';

interface Props {
  caseData: Case;
}

export default function CorrectionTaskCard({ caseData }: Props) {
  const tasks = caseData.corrections;
  const updateCorrection = useCaseStore((s) => s.updateCorrection);
  const updateCaseStage = useCaseStore((s) => s.updateCaseStage);
  const pushToast = useNotificationStore((s) => s.pushToast);

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center text-[11px] text-slate-400">
        <ClipboardCheck className="mx-auto mb-1 h-5 w-5 opacity-50" />
        当前无补录/修改任务
      </div>
    );
  }

  const markDone = (t: CorrectionTask) => {
    updateCorrection(t.id, { status: 'completed', replyContent: t.replyContent || '已按要求完成修改' });
    const remaining = tasks.filter((x) => x.id !== t.id && x.status !== 'completed');
    if (remaining.length === 0) {
      updateCaseStage(
        caseData.id,
        'quality_review',
        '张审（质控）',
        'quality_controller',
        `${ROLE_META[t.targetRole].label}完成全部补录，案件回退至质控重审`,
      );
      pushToast({
        id: uid('t'),
        type: 'success',
        title: '补录全部完成',
        message: '案件已自动回退至质控审核环节',
      });
    } else {
      pushToast({
        id: uid('t'),
        type: 'info',
        title: '任务已标记完成',
        message: `还有${remaining.length}项补录待处理`,
      });
    }
  };

  return (
    <div className="space-y-2">
      {tasks.map((t, idx) => {
        const overdue = t.status !== 'completed' && isOverdue(t.deadline);
        return (
          <div
            key={t.id}
            className={`rounded-lg border p-3 ${
              overdue
                ? 'border-rose-200 bg-rose-50/50'
                : t.status === 'completed'
                  ? 'border-emerald-200 bg-emerald-50/40'
                  : 'border-amber-200 bg-amber-50/40'
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex h-5 items-center rounded px-1.5 text-[10px] font-semibold ${
                    t.status === 'completed'
                      ? 'bg-emerald-600 text-white'
                      : overdue
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-amber-500 text-white'
                  }`}
                >
                  #{idx + 1}
                  {t.status === 'completed' ? ' 已完成' : overdue ? ' 已超期' : ' 待处理'}
                </span>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${ROLE_META[t.targetRole].color} bg-white/70 ring-1 ring-slate-200`}>
                  → {ROLE_META[t.targetRole].label}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10.5px] text-slate-500">
                <Clock className="h-3 w-3" />
                <span>截止 {formatDate(t.deadline)}</span>
                {overdue && <AlertCircle className="h-3 w-3 text-rose-600 animate-pulse" />}
              </div>
            </div>

            <div className="mb-2">
              <div className="text-[11px] font-semibold text-slate-700 mb-1">需完成事项：</div>
              <ul className="space-y-0.5">
                {t.requiredItems.map((item, i) => (
                  <li
                    key={i}
                    className={`flex items-start gap-1.5 text-[11.5px] leading-relaxed ${
                      t.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-700'
                    }`}
                  >
                    <span className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {t.status !== 'completed' ? (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                <input
                  defaultValue={t.replyContent || ''}
                  placeholder="填写修改说明后标记完成..."
                  className="flex-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100"
                  onBlur={(e) =>
                    updateCorrection(t.id, { replyContent: e.target.value || t.replyContent })
                  }
                />
                <button
                  onClick={() => markDone(t)}
                  className="flex items-center gap-1 rounded-md bg-amber-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-amber-700"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  提交完成
                </button>
              </div>
            ) : (
              t.replyContent && (
                <div className="rounded-md bg-white/70 p-2 text-[11px] leading-relaxed text-slate-600 ring-1 ring-slate-200">
                  <span className="font-semibold text-emerald-700">回复说明：</span>
                  {t.replyContent}
                </div>
              )
            )}
          </div>
        );
      })}
    </div>
  );
}
