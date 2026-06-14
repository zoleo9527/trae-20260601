import { useDispatchStore } from '@/stores/dispatchStore';
import type { Case } from '@/types';
import { useMemo } from 'react';
import { Eye, EyeOff, SkipBack, SkipForward, RotateCcw } from 'lucide-react';

interface Props {
  caseData: Case;
}

export default function ReplayControls({ caseData }: Props) {
  const replayMode = useDispatchStore((s) => s.replayMode);
  const replayStepIndex = useDispatchStore((s) => s.replayStepIndex);
  const setReplayStepIndex = useDispatchStore((s) => s.setReplayStepIndex);
  const toggleReplayMode = useDispatchStore((s) => s.toggleReplayMode);

  const maxSteps = 4;
  const currentStep = useMemo(() => {
    const hasPassed =
      caseData.reviews.some((r) => r.status === 'completed' && r.rejectedItems.length === 0) ||
      ['dispatch_notice', 'dispatch_sign', 'archived'].includes(caseData.currentStage);
    if (!caseData.dispatch) return hasPassed ? 1 : 0;
    if (caseData.currentStage === 'archived' && caseData.dispatch.archiveDate) return 4;
    if (caseData.dispatch.receiverIdCard && caseData.dispatch.pickupDate) return 3;
    if (caseData.dispatch.noticeDate) return 2;
    return hasPassed ? 1 : 0;
  }, [caseData]);

  return (
    <div className="flex items-center gap-1.5">
      {replayMode && (
        <>
          <button
            onClick={() => setReplayStepIndex(Math.max(1, replayStepIndex - 1))}
            disabled={replayStepIndex <= 1}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            title="上一步骤"
          >
            <SkipBack className="h-3.5 w-3.5" />
          </button>
          <div className="flex h-7 items-center rounded-md bg-slate-900 px-2 font-mono text-[11px] font-semibold text-white">
            {replayStepIndex} / {maxSteps}
          </div>
          <button
            onClick={() => setReplayStepIndex(Math.min(maxSteps, replayStepIndex + 1))}
            disabled={replayStepIndex >= maxSteps}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            title="下一步骤"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setReplayStepIndex(currentStep)}
            className="flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-600 hover:bg-slate-50"
            title="跳至当前状态"
          >
            <RotateCcw className="h-3 w-3" />
            当前
          </button>
        </>
      )}
      <button
        onClick={toggleReplayMode}
        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-all ${
          replayMode
            ? 'bg-sky-600 text-white shadow-sm shadow-sky-200'
            : 'border border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-700 hover:bg-sky-50'
        }`}
      >
        {replayMode ? (
          <>
            <EyeOff className="h-3.5 w-3.5" />
            退出回看
          </>
        ) : (
          <>
            <Eye className="h-3.5 w-3.5" />
            进入回看
          </>
        )}
      </button>
    </div>
  );
}
